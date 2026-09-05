import { CheckCircle2, ClipboardCopy, GitBranch, History, Layers3, LockKeyhole, RefreshCw, Rocket, ShieldCheck, Undo2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { authenticatedRequest } from '../../utils/authenticatedRequest';

interface SuperAdminWorkspaceControlProps {
  schools: any[];
  setSchools: React.Dispatch<React.SetStateAction<any[]>>;
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

const FEATURE_DEFINITIONS = [
  { key: 'students', label: 'شؤون الطلاب والحضور' },
  { key: 'exams', label: 'الامتحانات والنتائج' },
  { key: 'library', label: 'المكتبة المدرسية' },
  { key: 'teachers', label: 'المعلمون والموظفون' },
  { key: 'accounts', label: 'الحسابات العامة' },
  { key: 'student_accounts', label: 'الرسوم والأقساط' },
  { key: 'inventory', label: 'المخزون والعهد' },
  { key: 'buses', label: 'النقل المدرسي' },
  { key: 'uniform_management', label: 'الزي المدرسي' },
  { key: 'permissions_admin', label: 'المستخدمون والصلاحيات' },
];

type Scope = 'school' | 'selected' | 'global';

function normalizeFeatures(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, enabled]) => typeof enabled === 'boolean')) as Record<string, boolean>;
}

function diffFeatures(current: Record<string, boolean>, base: Record<string, boolean>): Record<string, boolean> {
  return Object.fromEntries(Object.entries(current).filter(([key, value]) => base[key] !== value));
}

export default function SuperAdminWorkspaceControl({
  schools = [],
  setSchools,
  logAction,
  triggerNotification,
}: SuperAdminWorkspaceControlProps) {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [releases, setReleases] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [scope, setScope] = useState<Scope>('school');
  const [templateId, setTemplateId] = useState('');
  const [channel, setChannel] = useState<'stable' | 'pilot'>('stable');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [templateForm, setTemplateForm] = useState({ key: '', name: '', description: '', sourceSchoolId: '' });
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  const schoolById = useMemo(() => new Map(schools.map((school) => [school.id, school])), [schools]);
  const selectedSchool = selectedSchoolId ? schoolById.get(selectedSchoolId) : null;
  const selectedWorkspace = workspaces.find((workspace) => workspace.schoolId === selectedSchoolId);
  const ownerWorkspace = workspaces.find((workspace) => workspace.isOwnerWorkspace);

  const loadControlPlane = async () => {
    setIsLoading(true);
    try {
      const [workspaceResponse, releaseResponse] = await Promise.all([
        authenticatedRequest('/api/admin/central/workspaces', { cache: 'no-store' }),
        authenticatedRequest('/api/admin/central/releases', { cache: 'no-store' }),
      ]);
      const workspacePayload = await workspaceResponse.json().catch(() => ({}));
      const releasePayload = await releaseResponse.json().catch(() => ({}));
      if (!workspaceResponse.ok || !workspacePayload?.success) throw new Error(workspacePayload?.message || 'تعذر قراءة مساحة المالك.');
      if (!releaseResponse.ok || !releasePayload?.success) throw new Error(releasePayload?.message || 'تعذر قراءة سجل الإصدارات.');
      setWorkspaces(Array.isArray(workspacePayload.workspaces) ? workspacePayload.workspaces : []);
      setTemplates(Array.isArray(workspacePayload.templates) ? workspacePayload.templates : []);
      setReleases(Array.isArray(releasePayload.releases) ? releasePayload.releases : []);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر تحميل مركز إصدارات المدارس.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadControlPlane();
  }, []);

  useEffect(() => {
    if (!selectedSchoolId && (ownerWorkspace?.schoolId || schools[0]?.id)) {
      setSelectedSchoolId(ownerWorkspace?.schoolId || schools[0].id);
    }
  }, [schools, selectedSchoolId, ownerWorkspace?.schoolId]);

  useEffect(() => {
    if (ownerWorkspace?.schoolId && templateForm.sourceSchoolId !== ownerWorkspace.schoolId) {
      setTemplateForm((current) => ({ ...current, sourceSchoolId: ownerWorkspace.schoolId }));
    }
  }, [ownerWorkspace?.schoolId, templateForm.sourceSchoolId]);

  useEffect(() => {
    const source = selectedWorkspace?.features || selectedSchool?.features || {};
    setFeatures(normalizeFeatures(source));
  }, [selectedSchoolId, selectedWorkspace, selectedSchool]);

  const updateLocalSchools = (updatedSchools: any[]) => {
    setSchools((current) => current.map((school) => {
      const updated = updatedSchools.find((item) => item.id === school.id);
      if (!updated) return school;
      const metadata = updated.central_metadata && typeof updated.central_metadata === 'object' ? updated.central_metadata : {};
      const workspace = metadata.ownerWorkspace && typeof metadata.ownerWorkspace === 'object' ? metadata.ownerWorkspace : {};
      return {
        ...school,
        ...metadata,
        id: updated.id,
        tenantId: updated.tenant_id,
        name: updated.display_name,
        schoolCode: updated.school_code,
        status: updated.status,
        features: normalizeFeatures(metadata.features),
        releaseVersion: Number(workspace.currentReleaseVersion || 0),
        templateId: workspace.templateId || undefined,
        templateVersion: Number(workspace.templateVersion || 0),
      };
    }));
  };

  const toggleTargetSchool = (schoolId: string) => {
    setSelectedSchoolIds((current) => current.includes(schoolId)
      ? current.filter((id) => id !== schoolId)
      : [...current, schoolId]);
  };

  const publishRelease = async (event: React.FormEvent) => {
    event.preventDefault();
    const targetIds = scope === 'school' ? [selectedSchoolId] : selectedSchoolIds;
    if (scope !== 'global' && !targetIds.length) {
      triggerNotification('اختر مدرسة واحدة على الأقل قبل نشر الإصدار.', 'warning');
      return;
    }
    if (!title.trim()) {
      triggerNotification('اكتب عنوانًا واضحًا للإصدار قبل اعتماده.', 'warning');
      return;
    }
    const templateFeatures = normalizeFeatures(selectedWorkspace?.templateManifest && typeof selectedWorkspace.templateManifest === 'object'
      ? (selectedWorkspace.templateManifest as any).features
      : {});
    const featureOverrides = diffFeatures(features, templateFeatures);
    if (!templateId && !Object.keys(featureOverrides).length) {
      triggerNotification('اختر قالبًا أو عدّل ميزة واحدة على الأقل.', 'warning');
      return;
    }
    setIsPublishing(true);
    try {
      const response = await authenticatedRequest('/api/admin/central/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope,
          schoolId: scope === 'school' ? selectedSchoolId : undefined,
          schoolIds: scope === 'selected' ? selectedSchoolIds : undefined,
          templateId: templateId || undefined,
          featureOverrides: Object.keys(featureOverrides).length ? featureOverrides : undefined,
          channel,
          title: title.trim(),
          notes: notes.trim() || undefined,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر اعتماد الإصدار الموجّه.');
      updateLocalSchools(Array.isArray(payload.schools) ? payload.schools : []);
      logAction('PUBLISH_TARGETED_SCHOOL_RELEASE', `اعتماد إصدار [${title.trim()}] لنطاق ${scope === 'global' ? 'كل المدارس' : `${targetIds.length} مدرسة`}`, 'مركز المالك والإصدارات');
      triggerNotification(`تم اعتماد الإصدار بنجاح لـ ${payload.targetCount} مدرسة.`, 'success');
      setTitle('');
      setNotes('');
      await loadControlPlane();
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر اعتماد الإصدار؛ لم تتغير أي مدرسة.', 'danger');
    } finally {
      setIsPublishing(false);
    }
  };

  const rollbackRelease = async (release: any) => {
    if (!window.confirm(`هل تريد التراجع عن إصدار "${release.title}" لمدرسة ${release.school_name}؟`)) return;
    try {
      const response = await authenticatedRequest(`/api/admin/central/releases/${encodeURIComponent(release.id)}/rollback`, { method: 'POST' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر التراجع عن الإصدار.');
      if (payload.school) updateLocalSchools([payload.school]);
      triggerNotification('تم التراجع عن الإصدار وإعادة آخر حالة سابقة للمدرسة.', 'success');
      await loadControlPlane();
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر التراجع؛ لم تتغير المدرسة.', 'danger');
    }
  };

  const createTemplate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!templateForm.key.trim() || !templateForm.name.trim()) {
      triggerNotification('أدخل مفتاح القالب واسمه قبل الحفظ.', 'warning');
      return;
    }
    setIsCreatingTemplate(true);
    try {
      const response = await authenticatedRequest('/api/admin/central/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateKey: templateForm.key.trim().toLowerCase(),
          name: templateForm.name.trim(),
          description: templateForm.description.trim() || undefined,
          sourceSchoolId: templateForm.sourceSchoolId || undefined,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !payload.template) throw new Error(payload?.message || 'تعذر إنشاء القالب.');
      setTemplates((current) => [payload.template, ...current]);
      setTemplateId(payload.template.id);
      setTemplateForm({ key: '', name: '', description: '', sourceSchoolId: '' });
      triggerNotification('تم إنشاء القالب كمسودة. راجعه ثم انشره قبل استخدامه.', 'success');
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر إنشاء القالب.', 'danger');
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const publishTemplate = async () => {
    if (!templateId) return;
    try {
      const response = await authenticatedRequest(`/api/admin/central/templates/${encodeURIComponent(templateId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'publish' }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !payload.template) throw new Error(payload?.message || 'تعذر نشر القالب.');
      setTemplates((current) => current.map((template) => template.id === payload.template.id ? payload.template : template));
      triggerNotification('تم نشر القالب وأصبح جاهزًا للتوزيع الموجّه.', 'success');
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر نشر القالب.', 'danger');
    }
  };

  return (
    <div id="super-admin-workspace-control" className="space-y-6 text-right" dir="rtl">
      <section className="rounded-3xl border-2 border-indigo-200 bg-gradient-to-l from-slate-950 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-indigo-300 uppercase"><ShieldCheck className="w-4 h-4" /> Owner Workspace & Release Control</div>
            <h2 className="mt-2 text-xl font-black">مركز المالك ونشر التحديثات الموجّه</h2>
            <p className="mt-2 max-w-3xl text-xs leading-6 text-indigo-100/80">القالب يحدد الأساس، وكل مدرسة تملك إصدارها الخاص. لا ينتقل أي تخصيص إلى مدرسة أخرى إلا بعد اختيار نطاق النشر صراحة.</p>
          </div>
          <div className="flex flex-col items-end gap-1 rounded-2xl border border-emerald-400/20 bg-emerald-950/30 px-4 py-3 text-[11px] font-black text-emerald-200"><div className="flex items-center gap-2"><LockKeyhole className="w-4 h-4" /> بيانات المدارس معزولة</div><div className="text-[10px] text-amber-200">{ownerWorkspace ? `مدرسة المالك: ${ownerWorkspace.schoolName}` : 'لم تُربط مدرسة المالك بعد'}</div></div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <form onSubmit={publishRelease} className="xl:col-span-7 rounded-3xl border border-indigo-200 bg-white p-6 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3"><h3 className="text-sm font-black text-slate-900 flex items-center gap-2"><Rocket className="w-4 h-4 text-indigo-600" /> اعتماد إصدار جديد</h3><button type="button" onClick={() => void loadControlPlane()} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" title="تحديث"><RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /></button></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-[11px] font-bold text-slate-600">نطاق النشر<select value={scope} onChange={(event) => setScope(event.target.value as Scope)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-black text-slate-800"><option value="school">مدرسة واحدة</option><option value="selected">مدارس محددة</option><option value="global">كل المدارس</option></select></label>
            <label className="text-[11px] font-bold text-slate-600">المدرسة الحالية<select value={selectedSchoolId} onChange={(event) => setSelectedSchoolId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-black text-slate-800"><option value="">اختر مدرسة</option>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label>
            <label className="text-[11px] font-bold text-slate-600">قناة الإصدار<select value={channel} onChange={(event) => setChannel(event.target.value as 'stable' | 'pilot')} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-black text-slate-800"><option value="stable">مستقر</option><option value="pilot">تجريبي محدد</option></select></label>
          </div>

          {scope === 'selected' && <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3"><div className="mb-2 text-[11px] font-black text-indigo-900">حدد المدارس المستلمة للإصدار</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{schools.map((school) => <label key={school.id} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[11px] font-bold text-slate-700"><input type="checkbox" checked={selectedSchoolIds.includes(school.id)} onChange={() => toggleTargetSchool(school.id)} />{school.name}</label>)}</div></div>}

          <label className="block text-[11px] font-bold text-slate-600">القالب الاختياري<select value={templateId} onChange={(event) => setTemplateId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-black text-slate-800"><option value="">بدون قالب — ميزات فقط</option>{templates.filter((template) => template.status !== 'archived').map((template) => <option key={template.id} value={template.id}>{template.name} • v{template.version} • {template.status === 'published' ? 'منشور' : 'مسودة'}</option>)}</select></label>
          <div><div className="mb-2 text-[11px] font-black text-slate-700">ميزات هذا الإصدار</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{FEATURE_DEFINITIONS.map((feature) => <label key={feature.key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-700"><span>{feature.label}</span><input type="checkbox" checked={features[feature.key] === true} onChange={(event) => setFeatures((current) => ({ ...current, [feature.key]: event.target.checked }))} /></label>)}</div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="عنوان الإصدار (مثال: تفعيل وحدة الامتحانات)" className="rounded-xl border border-slate-200 p-3 text-xs font-bold" /><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="ملاحظات الإصدار والتذكرة" className="rounded-xl border border-slate-200 p-3 text-xs font-bold" /></div>
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="text-[10px] leading-5 text-slate-500">{scope === 'global' ? 'سيُنشأ إصدار مستقل لكل مدرسة عميلة نشطة؛ مدرسة المالك مستثناة.' : 'لن تتأثر المدارس غير المحددة.'}</div><button disabled={isPublishing} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-black text-white shadow hover:bg-indigo-700 disabled:opacity-50"><Rocket className="w-4 h-4" />{isPublishing ? 'جارٍ الاعتماد...' : 'اعتماد ونشر الإصدار'}</button></div>
        </form>

        <div className="xl:col-span-5 space-y-6">
          <form onSubmit={createTemplate} className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 shadow"><h3 className="text-sm font-black text-amber-950 flex items-center gap-2"><Layers3 className="w-4 h-4" /> إنشاء مدرسة قالب من إعدادات أساسية</h3><p className="mt-1 text-[10px] leading-5 text-amber-900/70">القالب يُلتقط من مدرسة المالك فقط ولا يحتوي بيانات طلاب أو بيانات تشغيلية.</p><div className="mt-3 grid gap-2"><input value={templateForm.key} onChange={(event) => setTemplateForm((current) => ({ ...current, key: event.target.value }))} placeholder="template_key مثل: modern-family-default" className="rounded-xl border border-amber-200 bg-white p-2.5 text-xs font-mono" /><input value={templateForm.name} onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))} placeholder="اسم القالب" className="rounded-xl border border-amber-200 bg-white p-2.5 text-xs font-bold" /><select value={templateForm.sourceSchoolId} onChange={(event) => setTemplateForm((current) => ({ ...current, sourceSchoolId: event.target.value }))} className="rounded-xl border border-amber-200 bg-white p-2.5 text-xs font-bold"><option value="">مدرسة المالك (تلقائي)</option>{ownerWorkspace && <option value={ownerWorkspace.schoolId}>{ownerWorkspace.schoolName} — المالك</option>}</select><button disabled={isCreatingTemplate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"><ClipboardCopy className="w-4 h-4" />{isCreatingTemplate ? 'جارٍ الحفظ...' : 'حفظ القالب كمسودة'}</button></div></form>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow"><div className="flex items-center justify-between"><h3 className="text-sm font-black text-slate-900 flex items-center gap-2"><GitBranch className="w-4 h-4 text-indigo-600" />حالة المدرسة المحددة</h3>{selectedWorkspace && <span className={`rounded-full px-2 py-1 text-[10px] font-black ${selectedWorkspace.isOwnerWorkspace ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>{selectedWorkspace.isOwnerWorkspace ? 'مدرسة المالك' : `إصدار ${selectedWorkspace.currentReleaseVersion || 0}`}</span>}</div>{selectedSchool ? <div className="mt-3 space-y-2 text-[11px] font-bold text-slate-600"><div className="flex justify-between"><span>المدرسة</span><span className="text-slate-900">{selectedSchool.name}</span></div><div className="flex justify-between"><span>النطاق</span><span className="text-indigo-700">{selectedWorkspace?.isOwnerWorkspace ? 'المطور والمالك' : 'مدرسة عميلة معزولة'}</span></div><div className="flex justify-between"><span>القناة</span><span className="text-indigo-700">{selectedWorkspace?.releaseChannel || 'stable'}</span></div><div className="flex justify-between"><span>القالب</span><span className="text-slate-900">{selectedWorkspace?.templateKey || 'الأساس المحلي'}</span></div><button type="button" onClick={() => void publishTemplate()} disabled={!templateId || templates.find((template) => template.id === templateId)?.status === 'published'} className="mt-2 w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-[11px] font-black text-indigo-700 disabled:opacity-40">نشر القالب المحدد</button></div> : <div className="mt-3 text-xs text-slate-500">اختر مدرسة لعرض إصدارها.</div>}</div>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 p-5"><h3 className="text-sm font-black text-slate-900 flex items-center gap-2"><History className="w-4 h-4 text-indigo-600" />سجل الإصدارات الموجّهة والتراجع</h3><span className="text-[10px] font-bold text-slate-500">{releases.length} سجل</span></div><div className="divide-y divide-slate-100">{releases.length === 0 ? <div className="p-6 text-center text-xs text-slate-500">لا توجد إصدارات معتمدة بعد.</div> : releases.slice(0, 20).map((release) => <div key={release.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700">{release.school_name}</span><span className="font-mono text-[10px] font-black text-slate-500">v{release.release_version}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-600">{release.scope === 'global' ? 'عام' : release.scope === 'selected' ? 'محدد' : 'مدرسة واحدة'}</span></div><div className="mt-1 text-xs font-black text-slate-800">{release.title}</div><div className="mt-1 text-[10px] text-slate-500">{release.template_name ? `${release.template_name} • ` : ''}{release.channel} • {new Date(release.created_at).toLocaleString('ar')}</div></div><button type="button" onClick={() => void rollbackRelease(release)} disabled={release.status !== 'active'} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-black text-rose-700 disabled:opacity-30"><Undo2 className="w-3.5 h-3.5" />تراجع</button></div>)}</div></section>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-[11px] font-bold leading-6 text-emerald-900"><CheckCircle2 className="ml-1 inline h-4 w-4" /> التحديثات البرمجية العامة تبقى مشتركة لأسباب الأمان، أما الوحدات والإعدادات وطلبات المدارس فتُدار بإصدارات مستقلة لكل مدرسة.</div>
    </div>
  );
}
