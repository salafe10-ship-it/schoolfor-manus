import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  ClipboardCopy,
  ExternalLink,
  History,
  Layers3,
  LockKeyhole,
  RefreshCw,
  Rocket,
  School,
  ShieldCheck,
  Undo2,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { authenticatedRequest } from '../../utils/authenticatedRequest';

interface SuperAdminWorkspaceControlProps {
  schools: any[];
  setSchools: React.Dispatch<React.SetStateAction<any[]>>;
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
  onOpenOwnerSchool?: (school: any) => void;
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
  { key: 'school_users_admin', label: 'مستخدمو المدرسة والصلاحيات' },
];

const WORKFLOW_STEPS = [
  { id: 'central-school', number: '١', title: 'المدرسة المركزية', description: 'إعداد وتجربة الأساس' },
  { id: 'base-template', number: '٢', title: 'القالب الأساسي', description: 'التقاط ومراجعة واعتماد' },
  { id: 'release-builder', number: '٣', title: 'التوزيع', description: 'اختيار النطاق والنشر' },
  { id: 'release-history', number: '٤', title: 'المتابعة', description: 'سجل كامل وتراجع آمن' },
];

type Scope = 'school' | 'selected' | 'global';

function normalizeFeatures(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const normalized = Object.fromEntries(Object.entries(value).filter(([, enabled]) => typeof enabled === 'boolean')) as Record<string, boolean>;
  if (Object.prototype.hasOwnProperty.call(normalized, 'permissions_admin')
    && !Object.prototype.hasOwnProperty.call(normalized, 'school_users_admin')) {
    normalized.school_users_admin = normalized.permissions_admin;
  }
  delete normalized.permissions_admin;
  return normalized;
}

function diffFeatures(current: Record<string, boolean>, base: Record<string, boolean>): Record<string, boolean> {
  return Object.fromEntries(Object.entries(current).filter(([key, value]) => base[key] !== value));
}

function readObject(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}

function formatDate(value: unknown): string {
  if (!value) return 'لم يُسجل بعد';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? 'غير متحقق' : date.toLocaleString('ar-EG');
}

function templateStatusLabel(status: string): string {
  if (status === 'published') return 'معتمد وجاهز للتوزيع';
  if (status === 'draft') return 'مسودة تحتاج اعتمادًا';
  return 'مؤرشف';
}

export default function SuperAdminWorkspaceControl({
  schools = [],
  setSchools,
  logAction,
  triggerNotification,
  onOpenOwnerSchool,
}: SuperAdminWorkspaceControlProps) {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [releases, setReleases] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [scope, setScope] = useState<Scope>('school');
  const [managedTemplateId, setManagedTemplateId] = useState('');
  const [releaseTemplateId, setReleaseTemplateId] = useState('');
  const [channel, setChannel] = useState<'stable' | 'pilot'>('pilot');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [globalConfirmation, setGlobalConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isCapturingTemplate, setIsCapturingTemplate] = useState(false);
  const [isPublishingTemplate, setIsPublishingTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    key: 'central-school-base',
    name: 'القالب الأساسي للمدرسة المركزية',
    description: 'النسخة المرجعية المعتمدة لتهيئة المدارس الجديدة وتحديث المدارس الحالية.',
  });

  const schoolById = useMemo(() => new Map(schools.map((school) => [school.id, school])), [schools]);
  const ownerWorkspace = workspaces.find((workspace) => workspace.isOwnerWorkspace);
  const ownerSchool = ownerWorkspace ? schoolById.get(ownerWorkspace.schoolId) : null;
  const customerSchools = useMemo(() => {
    const ownerId = ownerWorkspace?.schoolId;
    return schools.filter((school) => school.id !== ownerId && school.status !== 'archived');
  }, [ownerWorkspace?.schoolId, schools]);
  const activeCustomerSchools = customerSchools.filter((school) => school.status === 'active');
  const selectedSchool = selectedSchoolId ? schoolById.get(selectedSchoolId) : null;
  const selectedWorkspace = workspaces.find((workspace) => workspace.schoolId === selectedSchoolId);
  const managedTemplate = templates.find((template) => template.id === managedTemplateId);
  const releaseTemplate = templates.find((template) => template.id === releaseTemplateId);
  const publishedTemplates = templates.filter((template) => template.status === 'published');
  const draftTemplates = templates.filter((template) => template.status === 'draft');

  const releaseBaseFeatures = useMemo(() => {
    if (releaseTemplate) return normalizeFeatures(readObject(releaseTemplate.manifest).features);
    return normalizeFeatures(selectedWorkspace?.features || selectedSchool?.features);
  }, [releaseTemplate, selectedSchool, selectedWorkspace]);
  const featureOverrides = useMemo(
    () => diffFeatures(features, releaseBaseFeatures),
    [features, releaseBaseFeatures],
  );
  const changedFeatureCount = Object.keys(featureOverrides).length;
  const releaseTargetCount = scope === 'global'
    ? activeCustomerSchools.length
    : scope === 'selected'
      ? selectedSchoolIds.length
      : selectedSchoolId ? 1 : 0;

  const loadControlPlane = async () => {
    setIsLoading(true);
    try {
      const [workspaceResponse, releaseResponse] = await Promise.all([
        authenticatedRequest('/api/admin/central/workspaces', { cache: 'no-store' }),
        authenticatedRequest('/api/admin/central/releases', { cache: 'no-store' }),
      ]);
      const workspacePayload = await workspaceResponse.json().catch(() => ({}));
      const releasePayload = await releaseResponse.json().catch(() => ({}));
      if (!workspaceResponse.ok || !workspacePayload?.success) throw new Error(workspacePayload?.message || 'تعذر قراءة مساحة المدرسة المركزية.');
      if (!releaseResponse.ok || !releasePayload?.success) throw new Error(releasePayload?.message || 'تعذر قراءة سجل الإصدارات.');

      const nextTemplates = Array.isArray(workspacePayload.templates) ? workspacePayload.templates : [];
      setWorkspaces(Array.isArray(workspacePayload.workspaces) ? workspacePayload.workspaces : []);
      setTemplates(nextTemplates);
      setReleases(Array.isArray(releasePayload.releases) ? releasePayload.releases : []);
      setManagedTemplateId((current) => current && nextTemplates.some((template: any) => template.id === current)
        ? current
        : (nextTemplates.find((template: any) => template.status === 'draft') || nextTemplates[0])?.id || '');
      setReleaseTemplateId((current) => current && nextTemplates.some((template: any) => template.id === current && template.status === 'published')
        ? current
        : nextTemplates.find((template: any) => template.status === 'published')?.id || '');
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر تحميل مركز قوالب المدارس.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadControlPlane();
  }, []);

  useEffect(() => {
    const selectedIsCustomer = customerSchools.some((school) => school.id === selectedSchoolId);
    if (!selectedIsCustomer) setSelectedSchoolId(activeCustomerSchools[0]?.id || customerSchools[0]?.id || '');
  }, [activeCustomerSchools, customerSchools, selectedSchoolId]);

  useEffect(() => {
    setSelectedSchoolIds((current) => current.filter((id) => activeCustomerSchools.some((school) => school.id === id)));
  }, [activeCustomerSchools]);

  useEffect(() => {
    setFeatures(releaseBaseFeatures);
  }, [releaseBaseFeatures]);

  useEffect(() => {
    if (scope !== 'global') setGlobalConfirmation(false);
  }, [scope]);

  const updateLocalSchools = (updatedSchools: any[]) => {
    setSchools((current) => current.map((school) => {
      const updated = updatedSchools.find((item) => item.id === school.id);
      if (!updated) return school;
      const metadata = readObject(updated.central_metadata);
      const workspace = readObject(metadata.ownerWorkspace);
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

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleTargetSchool = (schoolId: string) => {
    setSelectedSchoolIds((current) => current.includes(schoolId)
      ? current.filter((id) => id !== schoolId)
      : [...current, schoolId]);
  };

  const selectAllTargets = () => {
    setSelectedSchoolIds((current) => current.length === activeCustomerSchools.length
      ? []
      : activeCustomerSchools.map((school) => school.id));
  };

  const createTemplate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ownerWorkspace) {
      triggerNotification('اربط المدرسة المركزية أولًا قبل إنشاء القالب الأساسي.', 'warning');
      return;
    }
    if (!templateForm.key.trim() || !templateForm.name.trim()) {
      triggerNotification('أدخل اسم القالب ومعرّفه الداخلي قبل الحفظ.', 'warning');
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
          sourceSchoolId: ownerWorkspace.schoolId,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !payload.template) throw new Error(payload?.message || 'تعذر إنشاء القالب.');
      setTemplates((current) => [payload.template, ...current]);
      setManagedTemplateId(payload.template.id);
      logAction('CREATE_CENTRAL_SCHOOL_TEMPLATE', `التقاط القالب [${payload.template.name}] من المدرسة المركزية كمسودة`, 'المدرسة المركزية والقوالب');
      triggerNotification('تم التقاط إعدادات المدرسة المركزية في مسودة. راجعها ثم اعتمدها.', 'success');
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر إنشاء القالب.', 'danger');
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const captureTemplate = async () => {
    if (!managedTemplateId || !ownerWorkspace) return;
    if (managedTemplate?.status === 'published' && !window.confirm('سيتم حفظ آخر إعدادات المدرسة المركزية كإصدار جديد وتوزيعها تلقائياً على المدارس المرتبطة بالقالب. هل تريد المتابعة؟')) return;
    setIsCapturingTemplate(true);
    try {
      const response = await authenticatedRequest(`/api/admin/central/templates/${encodeURIComponent(managedTemplateId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'capture' }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !payload.template) throw new Error(payload?.message || 'تعذر التقاط إعدادات المدرسة المركزية.');
      setTemplates((current) => current.map((template) => template.id === payload.template.id ? payload.template : template));
      setReleaseTemplateId(payload.template.id);
      const targetCount = Number(payload?.propagation?.targetCount || 0);
      logAction('CAPTURE_AND_AUTO_PROPAGATE_CENTRAL_TEMPLATE', `تحديث الإصدار ${payload.template.version} من المدرسة المركزية وتوزيعه تلقائياً على ${targetCount} مدرسة`, 'المدرسة المركزية والقوالب');
      triggerNotification(`تم حفظ إصدار القالب وتوزيعه تلقائياً على ${targetCount} مدرسة مرتبطة.`, 'success');
      await loadControlPlane();
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر التقاط إعدادات المدرسة المركزية.', 'danger');
    } finally {
      setIsCapturingTemplate(false);
    }
  };

  const publishTemplate = async () => {
    if (!managedTemplateId) return;
    setIsPublishingTemplate(true);
    try {
      const response = await authenticatedRequest(`/api/admin/central/templates/${encodeURIComponent(managedTemplateId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'publish' }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !payload.template) throw new Error(payload?.message || 'تعذر اعتماد القالب.');
      setTemplates((current) => current.map((template) => template.id === payload.template.id ? payload.template : template));
      setReleaseTemplateId(payload.template.id);
      const targetCount = Number(payload?.propagation?.targetCount || 0);
      logAction('PUBLISH_AND_AUTO_PROPAGATE_CENTRAL_TEMPLATE', `اعتماد القالب [${payload.template.name}] وتوزيعه تلقائياً على ${targetCount} مدرسة`, 'المدرسة المركزية والقوالب');
      triggerNotification(`تم اعتماد القالب وتوزيعه تلقائياً على ${targetCount} مدرسة مرتبطة.`, 'success');
      await loadControlPlane();
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر اعتماد القالب.', 'danger');
    } finally {
      setIsPublishingTemplate(false);
    }
  };

  const publishRelease = async (event: React.FormEvent) => {
    event.preventDefault();
    const targetIds = scope === 'school' ? [selectedSchoolId].filter(Boolean) : selectedSchoolIds;
    if (scope !== 'global' && !targetIds.length) {
      triggerNotification('اختر مدرسة عميلة واحدة على الأقل قبل النشر.', 'warning');
      return;
    }
    if (scope === 'global' && !globalConfirmation) {
      triggerNotification('أكد فهمك أن الإصدار سيصل إلى كل المدارس العميلة النشطة.', 'warning');
      return;
    }
    if (!title.trim()) {
      triggerNotification('اكتب عنوانًا واضحًا للإصدار قبل اعتماده.', 'warning');
      return;
    }
    if (!releaseTemplateId && !changedFeatureCount) {
      triggerNotification('اختر قالبًا معتمدًا أو عدّل ميزة واحدة على الأقل.', 'warning');
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
          templateId: releaseTemplateId || undefined,
          featureOverrides: changedFeatureCount ? featureOverrides : undefined,
          channel,
          title: title.trim(),
          notes: notes.trim() || undefined,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر اعتماد الإصدار الموجّه.');
      updateLocalSchools(Array.isArray(payload.schools) ? payload.schools : []);
      logAction('PUBLISH_TARGETED_SCHOOL_RELEASE', `اعتماد إصدار [${title.trim()}] لـ ${payload.targetCount} مدرسة`, 'المدرسة المركزية والقوالب');
      triggerNotification(`تم نشر الإصدار بنجاح لـ ${payload.targetCount} مدرسة، مع إنشاء سجل مستقل لكل مدرسة.`, 'success');
      setTitle('');
      setNotes('');
      setGlobalConfirmation(false);
      await loadControlPlane();
      scrollToSection('release-history');
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
      logAction('ROLLBACK_SCHOOL_RELEASE', `التراجع عن الإصدار [${release.title}] للمدرسة ${release.school_name}`, 'المدرسة المركزية والقوالب');
      triggerNotification('تم التراجع وإعادة آخر حالة سابقة للمدرسة.', 'success');
      await loadControlPlane();
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر التراجع؛ لم تتغير المدرسة.', 'danger');
    }
  };

  const managedManifest = readObject(managedTemplate?.manifest);
  const managedFeatures = normalizeFeatures(managedManifest.features);
  const isReleaseReady = releaseTargetCount > 0
    && title.trim().length >= 2
    && Boolean(releaseTemplateId || changedFeatureCount)
    && (scope !== 'global' || globalConfirmation);

  return (
    <div id="super-admin-workspace-control" className="space-y-6 pb-8 text-right" dir="rtl">
      <section className="overflow-hidden rounded-3xl border border-indigo-300/30 bg-gradient-to-l from-slate-950 via-indigo-950 to-slate-900 text-white shadow-xl">
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-indigo-300 uppercase"><ShieldCheck className="h-4 w-4" /> Central School Operating Model</div>
            <h2 className="mt-2 text-2xl font-black">المدرسة المركزية والقالب الأساسي</h2>
            <p className="mt-2 text-xs font-bold leading-6 text-indigo-100/80">جهّز الأساس داخل مدرسة مركزية آمنة، التقطه كقالب، ثم وزّعه من الإدارة المركزية بنطاق صريح وسجل قابل للتراجع.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className={`rounded-2xl border px-4 py-3 ${ownerWorkspace ? 'border-emerald-400/25 bg-emerald-950/30 text-emerald-200' : 'border-amber-400/30 bg-amber-950/30 text-amber-200'}`}>
              <div className="flex items-center gap-2 text-[11px] font-black"><LockKeyhole className="h-4 w-4" />{ownerWorkspace ? 'المدرسة المركزية مربوطة' : 'الربط مطلوب'}</div>
              <div className="mt-1 text-[10px] opacity-80">{ownerWorkspace?.schoolName || 'لن يُنشأ قالب قبل ربط مدرسة المالك'}</div>
            </div>
            <button type="button" onClick={() => void loadControlPlane()} className="rounded-2xl border border-white/15 bg-white/10 p-3 text-indigo-100 transition hover:bg-white/15" title="تحديث البيانات"><RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} /></button>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-white/10 bg-black/10 md:grid-cols-4">
          {[
            ['المدرسة المركزية', ownerWorkspace ? 'جاهزة' : 'غير مربوطة'],
            ['القوالب المعتمدة', String(publishedTemplates.length)],
            ['مسودات للمراجعة', String(draftTemplates.length)],
            ['مدارس عميلة نشطة', String(activeCustomerSchools.length)],
          ].map(([label, value]) => <div key={label} className="border-l border-white/10 px-5 py-4 last:border-l-0"><div className="text-[10px] font-bold text-indigo-200/70">{label}</div><div className="mt-1 text-base font-black text-white">{value}</div></div>)}
        </div>
      </section>

      <nav className="grid grid-cols-1 gap-3 md:grid-cols-4" aria-label="دورة عمل المدرسة المركزية">
        {WORKFLOW_STEPS.map((step, index) => (
          <button key={step.id} type="button" onClick={() => scrollToSection(step.id)} className="group relative flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/50 dark:text-indigo-300">{step.number}</span>
            <span><span className="block text-xs font-black text-slate-900 dark:text-white">{step.title}</span><span className="mt-1 block text-[9px] font-bold text-slate-500">{step.description}</span></span>
            {index < WORKFLOW_STEPS.length - 1 && <ArrowLeft className="mr-auto hidden h-4 w-4 text-slate-300 xl:block" />}
          </button>
        ))}
      </nav>

      <section id="central-school" className="scroll-mt-6 rounded-3xl border border-amber-200 bg-gradient-to-l from-amber-50 to-white p-5 shadow-sm dark:border-amber-900/40 dark:from-amber-950/20 dark:to-slate-900">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><School className="h-5 w-5 text-amber-600" />١. المدرسة المركزية — بيئة إعداد وتجربة</div>
            <p className="mt-2 text-[11px] font-bold leading-6 text-slate-600 dark:text-slate-300">هذه المدرسة هي المصدر المرجعي فقط. اضبط فيها الوحدات والإعدادات العامة واختبرها، ثم عد إلى هنا لالتقاط نسخة. بيانات الطلاب والحسابات التشغيلية لا تدخل في القالب.</p>
            {ownerWorkspace ? (
              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-slate-950/50">
                <div><div className="text-sm font-black text-slate-900 dark:text-white">{ownerWorkspace.schoolName}</div><div className="mt-1 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500"><span>الرمز: {ownerWorkspace.schoolCode || 'غير محدد'}</span><span>•</span><span>{Object.values(normalizeFeatures(ownerWorkspace.features)).filter(Boolean).length} وحدات مفعلة</span><span>•</span><span>معزولة عن النشر العام</span></div></div>
                <button type="button" disabled={!ownerSchool || !onOpenOwnerSchool} onClick={() => ownerSchool && onOpenOwnerSchool?.(ownerSchool)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-[11px] font-black text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-40"><ExternalLink className="h-4 w-4" /> فتح بوابة المدرسة المركزية</button>
              </div>
            ) : <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[11px] font-black text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">لا توجد مدرسة مركزية مربوطة. استخدم إجراء ربط مدرسة المالك قبل إنشاء أي قالب.</div>}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-5">
            <ResponsibilityCard title="الإدارة المركزية مسؤولة عن" items={['الاعتماد وتحديد نطاق النشر', 'المتابعة والتدقيق والتراجع']} tone="indigo" />
            <ResponsibilityCard title="المدرسة المركزية مسؤولة عن" items={['تجهيز الإعدادات المرجعية', 'اختبار الوحدات قبل الالتقاط']} tone="amber" />
          </div>
        </div>
      </section>

      <section id="base-template" className="scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div><h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><Layers3 className="h-5 w-5 text-indigo-600" />٢. القالب الأساسي — حفظ وتوزيع تلقائي</h3><p className="mt-1 text-[10px] font-bold text-slate-500">حفظ تحديث قالب المدارس المركزي ينشئ إصداراً موثقاً ويصل تلقائياً إلى المدارس المرتبطة؛ بيانات الطلاب والمالية لا تُنسخ.</p></div>
          {managedTemplate && <span className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-black ${managedTemplate.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'}`}>{templateStatusLabel(managedTemplate.status)}</span>}
        </div>
        {templates.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <label className="block text-[11px] font-black text-slate-700 dark:text-slate-200">القالب الذي تعمل عليه الآن<select value={managedTemplateId} onChange={(event) => setManagedTemplateId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-black text-slate-800 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white">{templates.map((template) => <option key={template.id} value={template.id}>{template.name} • إصدار {template.version} • {template.status === 'published' ? 'معتمد' : 'مسودة'}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <InfoBox label="الإصدار" value={`v${managedTemplate?.version || 0}`} />
                <InfoBox label="الوحدات المفعلة" value={String(Object.values(managedFeatures).filter(Boolean).length)} />
                <div className="col-span-2"><InfoBox label="آخر التقاط" value={formatDate(managedManifest.capturedAt || managedTemplate?.updated_at)} /></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void captureTemplate()} disabled={!ownerWorkspace || !managedTemplateId || isCapturingTemplate} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-[11px] font-black text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-40 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300"><ClipboardCopy className="h-4 w-4" />{isCapturingTemplate ? 'جارٍ الحفظ والتوزيع...' : 'حفظ وتوزيع تحديث القالب'}</button>
                <button type="button" onClick={() => void publishTemplate()} disabled={!managedTemplateId || managedTemplate?.status === 'published' || isPublishingTemplate} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[11px] font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"><ShieldCheck className="h-4 w-4" />{isPublishingTemplate ? 'جارٍ الاعتماد...' : 'اعتماد القالب للتوزيع'}</button>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:col-span-5 dark:border-slate-700 dark:bg-slate-950/50">
              <div className="text-[11px] font-black text-slate-800 dark:text-white">محتوى النسخة المرجعية</div>
              <div className="mt-3 flex flex-wrap gap-2">{FEATURE_DEFINITIONS.map((feature) => <span key={feature.key} className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-black ${managedFeatures[feature.key] ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900'}`}>{managedFeatures[feature.key] ? '✓ ' : '— '}{feature.label}</span>)}</div>
            </div>
          </div>
        ) : <div className="mt-5 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/30 p-5 text-center dark:border-indigo-900/50 dark:bg-indigo-950/10"><Layers3 className="mx-auto h-8 w-8 text-indigo-400" /><div className="mt-2 text-xs font-black text-slate-800 dark:text-white">لا يوجد قالب أساسي بعد</div><div className="mt-1 text-[10px] font-bold text-slate-500">أنشئ أول مسودة من إعدادات المدرسة المركزية المربوطة.</div></div>}

        <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40" open={templates.length === 0}>
          <summary className="cursor-pointer text-[11px] font-black text-slate-700 dark:text-slate-200">إنشاء قالب جديد من المدرسة المركزية</summary>
          <form onSubmit={createTemplate} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-[10px] font-bold text-slate-500">اسم القالب<input value={templateForm.name} onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
            <label className="text-[10px] font-bold text-slate-500">المعرّف الداخلي<input dir="ltr" value={templateForm.key} onChange={(event) => setTemplateForm((current) => ({ ...current, key: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-left font-mono text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
            <label className="md:col-span-2 text-[10px] font-bold text-slate-500">وصف الاستخدام<textarea rows={2} value={templateForm.description} onChange={(event) => setTemplateForm((current) => ({ ...current, description: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
            <button disabled={isCreatingTemplate || !ownerWorkspace} className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-black text-white hover:bg-indigo-700 disabled:opacity-40"><ClipboardCopy className="h-4 w-4" />{isCreatingTemplate ? 'جارٍ إنشاء المسودة...' : 'التقاط وحفظ كمسودة'}</button>
          </form>
        </details>
      </section>

      <form id="release-builder" onSubmit={publishRelease} className="scroll-mt-6 rounded-3xl border border-indigo-200 bg-white p-5 shadow-lg dark:border-indigo-900/50 dark:bg-slate-900">
        <div className="border-b border-slate-100 pb-4 dark:border-slate-800"><h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><Rocket className="h-5 w-5 text-indigo-600" />٣. توزيع إصدار على المدارس</h3><p className="mt-1 text-[10px] font-bold text-slate-500">المدرسة المركزية لا تظهر ضمن المستلمين، وكل مدرسة تحصل على سجل إصدار مستقل.</p></div>
        <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-5 xl:col-span-8">
            <fieldset>
              <legend className="mb-2 text-[11px] font-black text-slate-700 dark:text-slate-200">أ. من سيستلم التحديث؟</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{([
                ['school', 'مدرسة واحدة', 'أعلى تحكم'],
                ['selected', 'مدارس محددة', 'دفعة تجريبية'],
                ['global', 'كل المدارس النشطة', 'نشر عام'],
              ] as const).map(([value, label, hint]) => <button key={value} type="button" onClick={() => setScope(value)} className={`rounded-xl border p-3 text-right transition ${scope === value ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100 dark:bg-indigo-950/30 dark:ring-indigo-900/40' : 'border-slate-200 bg-slate-50 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-950/40'}`}><span className="flex items-center gap-2 text-[11px] font-black text-slate-800 dark:text-white">{scope === value ? <CheckCircle2 className="h-4 w-4 text-indigo-600" /> : <Circle className="h-4 w-4 text-slate-300" />}{label}</span><span className="mt-1 block pr-6 text-[9px] font-bold text-slate-400">{hint}</span></button>)}</div>
            </fieldset>

            {scope === 'school' && <label className="block text-[11px] font-black text-slate-700 dark:text-slate-200">المدرسة المستلمة<select value={selectedSchoolId} onChange={(event) => setSelectedSchoolId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-black text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="">اختر مدرسة عميلة</option>{customerSchools.map((school) => <option key={school.id} value={school.id}>{school.name}{school.status !== 'active' ? ' — غير نشطة' : ''}</option>)}</select></label>}

            {scope === 'selected' && <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20"><div className="mb-3 flex items-center justify-between"><div className="text-[11px] font-black text-indigo-900 dark:text-indigo-200">حدد المدارس النشطة</div><button type="button" onClick={selectAllTargets} className="text-[10px] font-black text-indigo-700 dark:text-indigo-300">{selectedSchoolIds.length === activeCustomerSchools.length ? 'إلغاء الكل' : 'تحديد الكل'}</button></div><div className="grid max-h-52 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">{activeCustomerSchools.map((school) => <label key={school.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white bg-white px-3 py-2.5 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><input type="checkbox" checked={selectedSchoolIds.includes(school.id)} onChange={() => toggleTargetSchool(school.id)} />{school.name}</label>)}</div></div>}

            {scope === 'global' && <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[10px] font-bold leading-5 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300"><input type="checkbox" checked={globalConfirmation} onChange={(event) => setGlobalConfirmation(event.target.checked)} className="mt-1" /><span>أؤكد نشر إصدار مستقل على جميع المدارس العميلة النشطة وعددها {activeCustomerSchools.length}. المدرسة المركزية مستثناة تلقائيًا.</span></label>}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-200">ب. القالب المعتمد<select value={releaseTemplateId} onChange={(event) => setReleaseTemplateId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-black text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="">تحديث ميزات فقط — دون تغيير القالب</option>{publishedTemplates.map((template) => <option key={template.id} value={template.id}>{template.name} • v{template.version}</option>)}</select></label>
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-200">ج. قناة التوزيع<select value={channel} onChange={(event) => setChannel(event.target.value as 'stable' | 'pilot')} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-black text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="pilot">تجريبي — للمراجعة أولًا</option><option value="stable">مستقر — للاستخدام العام</option></select></label>
            </div>

            <div><div className="mb-2 flex items-center justify-between"><div className="text-[11px] font-black text-slate-700 dark:text-slate-200">د. تخصيص الوحدات لهذا الإصدار</div><span className="text-[9px] font-bold text-slate-400">{changedFeatureCount ? `${changedFeatureCount} تعديلات فوق القالب` : 'مطابق للقالب دون تخصيص'}</span></div><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{FEATURE_DEFINITIONS.map((feature) => <label key={feature.key} className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-[10px] font-bold transition ${featureOverrides[feature.key] !== undefined ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200' : 'border-slate-100 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200'}`}><span>{feature.label}</span><input type="checkbox" checked={features[feature.key] === true} onChange={(event) => setFeatures((current) => ({ ...current, [feature.key]: event.target.checked }))} /></label>)}</div></div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-200">هـ. عنوان الإصدار<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="مثال: الإصدار الأساسي للعام الدراسي" className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-200">ملاحظات المراجعة<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="سبب الإصدار وما تم اختباره" className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50 to-white p-5 xl:col-span-4 dark:border-indigo-900/50 dark:from-indigo-950/30 dark:to-slate-950">
            <div className="text-xs font-black text-indigo-950 dark:text-indigo-100">ملخص قبل الاعتماد</div>
            <div className="mt-4 space-y-3 text-[10px] font-bold">
              <SummaryRow label="المستلمون" value={`${releaseTargetCount} مدرسة`} />
              <SummaryRow label="القالب" value={releaseTemplate?.name || 'لا تغيير'} />
              <SummaryRow label="التخصيصات" value={String(changedFeatureCount)} />
              <div className="flex justify-between gap-3"><span className="text-slate-500">القناة</span><span className={channel === 'pilot' ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}>{channel === 'pilot' ? 'تجريبي' : 'مستقر'}</span></div>
            </div>
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[9px] font-bold leading-5 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"><LockKeyhole className="ml-1 inline h-3.5 w-3.5" />لن تتأثر أي مدرسة خارج النطاق، ويمكن التراجع لكل مدرسة على حدة.</div>
            <button disabled={isPublishing || !isReleaseReady} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-black text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"><Rocket className="h-4 w-4" />{isPublishing ? 'جارٍ الاعتماد...' : 'اعتماد ونشر الإصدار'}</button>
            {!isReleaseReady && <p className="mt-2 text-center text-[9px] font-bold text-slate-400">أكمل النطاق والعنوان واختر قالبًا أو تخصيصًا.</p>}
          </aside>
        </div>
      </form>

      <section id="release-history" className="scroll-mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800"><div><h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><History className="h-5 w-5 text-indigo-600" />٤. سجل التوزيع والتراجع</h3><p className="mt-1 text-[10px] font-bold text-slate-500">كل صف يمثل إصدار مدرسة مستقلًا، حتى عند النشر الجماعي.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">{releases.length} سجل</span></div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {releases.length === 0 ? <div className="p-8 text-center text-xs font-bold text-slate-500">لا توجد إصدارات معتمدة بعد.</div> : releases.slice(0, 25).map((release) => (
            <div key={release.id} className="flex flex-col items-start justify-between gap-3 p-4 transition hover:bg-slate-50 md:flex-row md:items-center dark:hover:bg-slate-950/40">
              <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">{release.school_name}</span><span className="font-mono text-[10px] font-black text-slate-500">v{release.release_version}</span><span className={`rounded-full px-2 py-1 text-[9px] font-black ${release.channel === 'pilot' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>{release.channel === 'pilot' ? 'تجريبي' : 'مستقر'}</span>{release.status === 'rolled_back' && <span className="rounded-full bg-rose-100 px-2 py-1 text-[9px] font-black text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">تم التراجع</span>}</div><div className="mt-2 text-xs font-black text-slate-800 dark:text-white">{release.title}</div><div className="mt-1 text-[10px] font-bold text-slate-500">{release.template_name ? `${release.template_name} • ` : 'تحديث وحدات • '}{formatDate(release.created_at)}</div></div>
              <button type="button" onClick={() => void rollbackRelease(release)} disabled={release.status !== 'active'} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"><Undo2 className="h-3.5 w-3.5" />تراجع آمن</button>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-[11px] font-bold leading-6 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"><CheckCircle2 className="ml-1 inline h-4 w-4" /> النموذج التشغيلي الآن واضح: تعديلات «قالب المدارس المركزي» تحفظ كإصدار موثق وتنتقل تلقائياً إلى المدارس المرتبطة، بينما تبقى بيانات كل مدرسة وعملاؤها ومعاملاتها معزولة وقابلة للتراجع لكل مدرسة.</div>
    </div>
  );
}

function ResponsibilityCard({ title, items, tone }: { title: string; items: string[]; tone: 'indigo' | 'amber' }) {
  const classes = tone === 'indigo'
    ? 'border-indigo-100 bg-indigo-50/60 text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-200'
    : 'border-amber-100 bg-amber-50/70 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200';
  return <div className={`rounded-2xl border p-4 ${classes}`}><div className="text-[11px] font-black">{title}</div><ul className="mt-3 space-y-2 text-[10px] font-bold opacity-80">{items.map((item) => <li key={item} className="flex gap-2"><Check className="h-3.5 w-3.5 shrink-0" />{item}</li>)}</ul></div>;
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return <div className="h-full rounded-xl bg-slate-50 p-3 dark:bg-slate-950"><div className="text-[9px] font-bold text-slate-400">{label}</div><div className="mt-1 text-xs font-black text-slate-800 dark:text-white">{value}</div></div>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3 border-b border-indigo-100 pb-2 dark:border-indigo-900/40"><span className="text-slate-500">{label}</span><span className="text-left text-slate-900 dark:text-white">{value}</span></div>;
}
