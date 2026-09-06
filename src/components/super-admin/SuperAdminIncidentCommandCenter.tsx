import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  GitBranch,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Siren,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { authenticatedRequest } from '../../utils/authenticatedRequest';

interface SuperAdminIncidentCommandCenterProps {
  schools: any[];
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
  onNavigateToTab?: (tab: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  detected: 'مكتشفة',
  triaged: 'مصنفة',
  assigned: 'مسندة',
  in_progress: 'قيد المعالجة',
  monitoring: 'تحت التحقق',
  resolved: 'تمت المعالجة',
  closed: 'مغلقة',
};

const EVENT_LABELS: Record<string, string> = {
  created: 'فتح الحادثة',
  triaged: 'تصنيف أولي',
  assigned: 'إسناد للفريق',
  status_changed: 'تغيير المرحلة',
  comment: 'ملاحظة عمل',
  resolved: 'تسجيل المعالجة',
  closed: 'إغلاق بعد التحقق',
  reopened: 'إعادة فتح',
  release_linked: 'ربط إصدار علاجي',
  updated: 'تحديث البيانات',
};

const CATEGORY_LABELS: Record<string, string> = {
  application: 'التطبيق',
  database: 'قاعدة البيانات',
  access: 'الدخول والصلاحيات',
  performance: 'الأداء',
  subscription: 'الاشتراك',
  integration: 'التكاملات',
  release: 'الإصدارات',
  security: 'الأمان',
  other: 'أخرى',
};

const SEVERITY_META: Record<string, { label: string; className: string; sla: string }> = {
  sev1: { label: 'حرجة P1', className: 'border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300', sla: 'استجابة خلال ساعة' },
  sev2: { label: 'عالية P2', className: 'border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300', sla: 'استجابة خلال 4 ساعات' },
  sev3: { label: 'متوسطة P3', className: 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300', sla: 'استجابة خلال يوم' },
  sev4: { label: 'منخفضة P4', className: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300', sla: 'استجابة خلال 3 أيام' },
};

const NEXT_ACTIONS: Record<string, Array<{ status: string; label: string }>> = {
  detected: [{ status: 'triaged', label: 'تصنيف الحادثة' }],
  triaged: [],
  assigned: [{ status: 'in_progress', label: 'بدء المعالجة' }],
  in_progress: [{ status: 'monitoring', label: 'بدء التحقق' }],
  monitoring: [{ status: 'in_progress', label: 'إعادة للمعالجة' }],
};

const emptyForm = {
  schoolId: '',
  title: '',
  description: '',
  category: 'application',
  severity: 'sev3',
  impactScope: 'school',
  ownerAuthUserId: '',
  source: 'central_review',
  sourceEventId: '',
  traceId: '',
};

function formatDate(value: unknown): string {
  if (!value) return 'غير محدد';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? 'غير متحقق' : date.toLocaleString('ar-EG');
}

function incidentCode(incident: any): string {
  return `INC-${String(incident.incident_number || '').padStart(5, '0')}`;
}

function isOpenIncident(incident: any): boolean {
  return !['resolved', 'closed'].includes(incident.status);
}

function isBreached(incident: any): boolean {
  return isOpenIncident(incident) && Boolean(incident.due_at) && Date.parse(incident.due_at) < Date.now();
}

export default function SuperAdminIncidentCommandCenter({
  schools = [],
  logAction,
  triggerNotification,
  onNavigateToTab,
}: SuperAdminIncidentCommandCenterProps) {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('open');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [workNote, setWorkNote] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [rootCause, setRootCause] = useState('');

  const selectedIncident = incidents.find((incident) => incident.id === selectedIncidentId) || null;
  const activeTeam = team.filter((member) => member.status === 'active');

  const loadCommandCenter = async (showNotification = false) => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [incidentResponse, healthResponse] = await Promise.all([
        authenticatedRequest('/api/admin/central/incidents', { cache: 'no-store' }),
        authenticatedRequest('/api/admin/central/health', { cache: 'no-store' }),
      ]);
      const [incidentPayload, healthPayload] = await Promise.all([
        incidentResponse.json().catch(() => ({})),
        healthResponse.json().catch(() => ({})),
      ]);
      if (!incidentResponse.ok || !incidentPayload?.success) throw new Error(incidentPayload?.message || 'تعذر تحميل مركز الحوادث.');

      const nextIncidents = Array.isArray(incidentPayload.incidents) ? incidentPayload.incidents : [];
      setIncidents(nextIncidents);
      setSignals(Array.isArray(incidentPayload.signals) ? incidentPayload.signals : []);
      setTeam(Array.isArray(incidentPayload.team) ? incidentPayload.team : []);
      setHealth(healthResponse.ok && healthPayload?.success ? healthPayload.health : null);
      setSelectedIncidentId((current) => current && nextIncidents.some((incident: any) => incident.id === current)
        ? current
        : nextIncidents.find(isOpenIncident)?.id || nextIncidents[0]?.id || '');
      if (showNotification) triggerNotification('تم تحديث الحوادث والإشارات وحالة المنصة.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر تحميل مركز قيادة الدعم.';
      setLoadError(message);
      if (showNotification) triggerNotification(message, 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCommandCenter();
  }, []);

  useEffect(() => {
    setSelectedOwnerId(selectedIncident?.owner_auth_user_id || '');
    setWorkNote('');
    setResolutionSummary(selectedIncident?.resolution_summary || '');
    setRootCause(selectedIncident?.root_cause || '');
  }, [selectedIncidentId, selectedIncident?.version]);

  const metrics = useMemo(() => {
    const open = incidents.filter(isOpenIncident);
    return {
      open: open.length,
      critical: open.filter((incident) => incident.severity === 'sev1').length,
      breached: open.filter(isBreached).length,
      unassigned: open.filter((incident) => !incident.owner_auth_user_id).length,
    };
  }, [incidents]);

  const filteredIncidents = useMemo(() => incidents.filter((incident) => {
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'open' ? isOpenIncident(incident) : incident.status === statusFilter);
    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
    const matchesSchool = schoolFilter === 'all' || incident.school_id === schoolFilter;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [incident.title, incident.school_name, incident.owner_name, incident.trace_id, incidentCode(incident)].some((value) => String(value || '').toLowerCase().includes(query));
    return matchesStatus && matchesSeverity && matchesSchool && matchesSearch;
  }), [incidents, schoolFilter, search, severityFilter, statusFilter]);

  const openCreateForm = (signal?: any) => {
    setForm(signal ? {
      ...emptyForm,
      schoolId: signal.school_id || '',
      title: signal.action === 'SYSTEM_CRITICAL_ERROR' ? 'خطأ حرج يحتاج معالجة' : `مراجعة إشارة: ${signal.action || signal.source || 'حدث مركزي'}`,
      description: signal.reason || 'تم اكتشاف الإشارة تلقائيًا من سجل التدقيق المركزي.',
      category: signal.action === 'SYSTEM_CRITICAL_ERROR' ? 'application' : String(signal.result || '').toLowerCase() === 'denied' ? 'security' : 'application',
      severity: signal.suggestedSeverity || 'sev3',
      impactScope: signal.school_id ? 'school' : 'platform',
      source: 'audit',
      sourceEventId: signal.id,
      traceId: signal.metadata?.traceId || '',
    } : emptyForm);
    setShowCreate(true);
  };

  const createIncident = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await authenticatedRequest('/api/admin/central/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !payload.incident) throw new Error(payload?.message || 'تعذر فتح الحادثة.');
      setShowCreate(false);
      setForm(emptyForm);
      logAction('OPEN_PLATFORM_INCIDENT', `فتح ${incidentCode(payload.incident)}: ${payload.incident.title}`, 'مركز قيادة الدعم');
      triggerNotification(`تم فتح ${incidentCode(payload.incident)} وإدخالها في مسار الفريق.`, 'success');
      await loadCommandCenter();
      setSelectedIncidentId(payload.incident.id);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر فتح الحادثة.', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const updateIncident = async (body: Record<string, unknown>, successMessage: string) => {
    if (!selectedIncident) return;
    setIsSaving(true);
    try {
      const response = await authenticatedRequest(`/api/admin/central/incidents/${encodeURIComponent(selectedIncident.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, expectedVersion: selectedIncident.version }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر تحديث الحادثة.');
      logAction('UPDATE_PLATFORM_INCIDENT', `${incidentCode(selectedIncident)} — ${successMessage}`, 'مركز قيادة الدعم');
      triggerNotification(successMessage, 'success');
      await loadCommandCenter();
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر تحديث الحادثة.', 'danger');
      await loadCommandCenter();
    } finally {
      setIsSaving(false);
    }
  };

  const assignIncident = () => {
    if (!selectedOwnerId) {
      triggerNotification('اختر عضوًا من فريق الإدارة المركزية.', 'warning');
      return;
    }
    void updateIncident({ operation: 'assign', ownerAuthUserId: selectedOwnerId, note: workNote || 'تم إسناد مسؤولية المتابعة.' }, 'تم إسناد الحادثة وتثبيت مسؤول واضح لها.');
  };

  const addComment = () => {
    if (workNote.trim().length < 2) {
      triggerNotification('اكتب ملاحظة عمل واضحة.', 'warning');
      return;
    }
    void updateIncident({ operation: 'comment', note: workNote.trim() }, 'تمت إضافة الملاحظة إلى خط زمني غير قابل للمحو.');
  };

  const resolveIncident = () => {
    if (resolutionSummary.trim().length < 4) {
      triggerNotification('اكتب ملخصًا واضحًا للمعالجة قبل تسجيل الحل.', 'warning');
      return;
    }
    void updateIncident({ operation: 'resolve', resolutionSummary: resolutionSummary.trim(), rootCause: rootCause.trim() || undefined, note: workNote.trim() || undefined }, 'تم تسجيل المعالجة ونقل الحادثة إلى التحقق النهائي.');
  };

  return (
    <div id="super-admin-incident-command" className="space-y-6 pb-8 text-right" dir="rtl">
      <section className="overflow-hidden rounded-3xl border border-rose-400/20 bg-gradient-to-l from-slate-950 via-[#26113a] to-slate-900 text-white shadow-2xl">
        <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-rose-300 uppercase"><Siren className="h-4 w-4" /> Incident Command & Team Operations</div>
            <h2 className="mt-2 text-2xl font-black">مركز قيادة الدعم ومعالجة مشاكل المدارس</h2>
            <p className="mt-2 max-w-3xl text-xs font-bold leading-6 text-slate-300">اكتشاف مركزي، أولوية واضحة، مسؤول محدد، خط زمني موثق، معالجة من المدرسة المركزية، ثم تحقق وإغلاق احترافي.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => openCreateForm()} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-xs font-black text-white hover:bg-rose-700"><Plus className="h-4 w-4" />فتح حادثة</button>
            <button type="button" onClick={() => void loadCommandCenter(true)} className="rounded-xl border border-white/15 bg-white/10 p-3 text-slate-200 hover:bg-white/15" title="تحديث"><RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /></button>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-white/10 bg-black/15 md:grid-cols-5">
          <Metric label="حوادث مفتوحة" value={metrics.open} tone="text-white" />
          <Metric label="حرجة P1" value={metrics.critical} tone="text-rose-300" />
          <Metric label="تجاوزت SLA" value={metrics.breached} tone="text-orange-300" />
          <Metric label="دون مسؤول" value={metrics.unassigned} tone="text-amber-300" />
          <Metric label="المصدر المركزي" value={health?.database === 'reachable' ? 'متصل' : 'غير متحقق'} tone={health?.database === 'reachable' ? 'text-emerald-300' : 'text-slate-400'} />
        </div>
      </section>

      {loadError && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[11px] font-black text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300"><AlertCircle className="ml-1 inline h-4 w-4" />{loadError} — طبّق ترحيل مركز الحوادث ثم أعد التحديث.</div>}

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-5" aria-label="مسار معالجة الحادثة">
        {[
          ['١', 'اكتشاف', 'إشارة آلية أو بلاغ مدرسة', 'bg-rose-600'],
          ['٢', 'تصنيف', 'أثر وأولوية وSLA', 'bg-orange-600'],
          ['٣', 'إسناد', 'مسؤول وفريق واضح', 'bg-indigo-600'],
          ['٤', 'معالجة', 'تشخيص وإصدار علاجي', 'bg-violet-600'],
          ['٥', 'تحقق وإغلاق', 'مراقبة وتوثيق السبب', 'bg-emerald-600'],
        ].map(([number, title, description, color]) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black text-white ${color}`}>{number}</div><div className="mt-3 text-xs font-black text-slate-900 dark:text-white">{title}</div><div className="mt-1 text-[9px] font-bold text-slate-500">{description}</div></div>)}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><Activity className="h-4 w-4 text-rose-600" />إشارات تحتاج مراجعة</h3><p className="mt-1 text-[9px] font-bold text-slate-500">مستخرجة من أخطاء وفشل ورفض آخر 7 أيام ولم تتحول إلى حادثة بعد.</p></div>
            <span className="w-fit rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{signals.length} إشارة</span>
          </div>
          <div className="mt-4 grid max-h-72 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
            {signals.length === 0 ? <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-[10px] font-bold text-slate-500 dark:border-slate-700">لا توجد إشارات جديدة من المصدر المركزي.</div> : signals.slice(0, 12).map((signal) => (
              <div key={signal.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/50">
                <div className="flex items-start justify-between gap-2"><span className={`rounded-lg border px-2 py-1 text-[9px] font-black ${SEVERITY_META[signal.suggestedSeverity]?.className}`}>{SEVERITY_META[signal.suggestedSeverity]?.label}</span><span className="text-[9px] font-bold text-slate-400">{formatDate(signal.created_at)}</span></div>
                <div className="mt-2 text-[11px] font-black text-slate-800 dark:text-white">{signal.action || signal.source}</div>
                <div className="mt-1 line-clamp-2 text-[9px] font-bold leading-5 text-slate-500">{signal.reason || 'إشارة من سجل التدقيق المركزي'}</div>
                <div className="mt-3 flex items-center justify-between"><span className="text-[9px] font-black text-indigo-700 dark:text-indigo-300">{signal.school_name || 'نطاق المنصة'}</span><button type="button" onClick={() => openCreateForm(signal)} className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[9px] font-black text-white dark:bg-indigo-600">تحويل إلى حادثة</button></div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-sm xl:col-span-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <h3 className="flex items-center gap-2 text-sm font-black text-indigo-950 dark:text-indigo-100"><Users className="h-4 w-4" />لوحة عمل الفريق</h3>
          <div className="mt-4 space-y-2">
            <TeamLink icon={<Activity className="h-4 w-4" />} label="فحص صحة المنصة" hint="الاتصال والمخطط" onClick={() => onNavigateToTab?.('health')} />
            <TeamLink icon={<FileText className="h-4 w-4" />} label="دليل التدقيق" hint="الأثر والـ Trace ID" onClick={() => onNavigateToTab?.('audit')} />
            <TeamLink icon={<GitBranch className="h-4 w-4" />} label="القالب والإصدار العلاجي" hint="اختبار ثم نشر موجّه" onClick={() => onNavigateToTab?.('workspace_control')} />
            <TeamLink icon={<MessageSquare className="h-4 w-4" />} label="التواصل مع المدرسة" hint="إشعار مركزي موثق" onClick={() => onNavigateToTab?.('broadcast')} />
          </div>
          <div className="mt-4 rounded-xl border border-indigo-200 bg-white/70 p-3 text-[9px] font-bold leading-5 text-indigo-800 dark:border-indigo-900/50 dark:bg-slate-950/30 dark:text-indigo-300"><UserCheck className="ml-1 inline h-3.5 w-3.5" />{activeTeam.length} أعضاء متاحون للإسناد من دليل الهوية المركزي.</div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg xl:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-3 border-b border-slate-100 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between"><h3 className="text-sm font-black text-slate-900 dark:text-white">طابور الحوادث</h3><span className="text-[10px] font-black text-slate-500">{filteredIncidents.length} نتيجة</span></div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <label className="relative col-span-2 md:col-span-1"><Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث سريع" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-8 pl-2 text-[10px] font-bold dark:border-slate-700 dark:bg-slate-950" /></label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-[10px] font-black dark:border-slate-700 dark:bg-slate-950"><option value="open">المفتوحة</option><option value="all">كل الحالات</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-[10px] font-black dark:border-slate-700 dark:bg-slate-950"><option value="all">كل الأولويات</option>{Object.entries(SEVERITY_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select>
              <select value={schoolFilter} onChange={(event) => setSchoolFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-[10px] font-black dark:border-slate-700 dark:bg-slate-950"><option value="all">كل المدارس</option>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select>
            </div>
          </div>
          <div className="max-h-[760px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
            {filteredIncidents.length === 0 ? <div className="p-10 text-center text-[11px] font-bold text-slate-500">لا توجد حوادث تطابق التصفية الحالية.</div> : filteredIncidents.map((incident) => (
              <button key={incident.id} type="button" onClick={() => setSelectedIncidentId(incident.id)} className={`w-full p-4 text-right transition ${selectedIncidentId === incident.id ? 'bg-indigo-50 dark:bg-indigo-950/25' : 'hover:bg-slate-50 dark:hover:bg-slate-950/40'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2"><div className="flex items-center gap-2"><span className={`rounded-lg border px-2 py-1 text-[9px] font-black ${SEVERITY_META[incident.severity]?.className}`}>{SEVERITY_META[incident.severity]?.label}</span><span className="font-mono text-[9px] font-black text-slate-400">{incidentCode(incident)}</span>{isBreached(incident) && <span className="rounded-lg bg-rose-600 px-2 py-1 text-[8px] font-black text-white">SLA متجاوز</span>}</div><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">{STATUS_LABELS[incident.status]}</span></div>
                <div className="mt-2 text-xs font-black text-slate-900 dark:text-white">{incident.title}</div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-bold text-slate-500"><span>{incident.school_name || 'نطاق المنصة'}</span><span>{CATEGORY_LABELS[incident.category]}</span><span>المسؤول: {incident.owner_name || 'غير مسندة'}</span><span>الموعد: {formatDate(incident.due_at)}</span></div>
              </button>
            ))}
          </div>
        </div>

        <div className="xl:col-span-5">
          {selectedIncident ? (
            <IncidentDetail
              incident={selectedIncident}
              team={activeTeam}
              selectedOwnerId={selectedOwnerId}
              setSelectedOwnerId={setSelectedOwnerId}
              workNote={workNote}
              setWorkNote={setWorkNote}
              resolutionSummary={resolutionSummary}
              setResolutionSummary={setResolutionSummary}
              rootCause={rootCause}
              setRootCause={setRootCause}
              isSaving={isSaving}
              onAssign={assignIncident}
              onComment={addComment}
              onResolve={resolveIncident}
              onTransition={(status) => void updateIncident({ operation: 'transition', status, note: workNote.trim() || undefined }, `تم نقل الحادثة إلى: ${STATUS_LABELS[status]}.`)}
              onClose={() => void updateIncident({ operation: 'close', note: workNote.trim() || 'تم التحقق من ثبات المعالجة.' }, 'تم إغلاق الحادثة بعد التحقق.')}
              onReopen={() => void updateIncident({ operation: 'reopen', note: workNote.trim() || 'ظهرت المشكلة مجددًا.' }, 'تمت إعادة فتح الحادثة للمعالجة.')}
            />
          ) : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-[11px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-900"><Wrench className="mx-auto mb-3 h-8 w-8 text-slate-300" />اختر حادثة لعرض خطة العمل والخط الزمني.</div>}
        </div>
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <form onSubmit={createIncident} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-base font-black text-slate-900 dark:text-white">فتح حادثة تشغيلية</h3><p className="mt-1 text-[10px] font-bold text-slate-500">سجل موحد من الاكتشاف حتى الإغلاق، دون نسخ بيانات المدرسة التشغيلية.</p></div><button type="button" onClick={() => setShowCreate(false)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">إلغاء</button></div>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="md:col-span-2 text-[10px] font-black text-slate-600 dark:text-slate-300">عنوان واضح<input required minLength={4} maxLength={200} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-950" /></label>
              <label className="md:col-span-2 text-[10px] font-black text-slate-600 dark:text-slate-300">الوصف والأثر<textarea rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-950" /></label>
              <SelectField label="المدرسة المتأثرة" value={form.schoolId} onChange={(value) => setForm((current) => ({ ...current, schoolId: value, impactScope: value ? 'school' : 'platform' }))}><option value="">المنصة / عدة مدارس</option>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</SelectField>
              <SelectField label="الأولوية وSLA" value={form.severity} onChange={(value) => setForm((current) => ({ ...current, severity: value }))}>{Object.entries(SEVERITY_META).map(([value, meta]) => <option key={value} value={value}>{meta.label} — {meta.sla}</option>)}</SelectField>
              <SelectField label="التصنيف" value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))}>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
              <SelectField label="المسؤول الأول" value={form.ownerAuthUserId} onChange={(value) => setForm((current) => ({ ...current, ownerAuthUserId: value }))}><option value="">يُسند بعد التصنيف</option>{activeTeam.map((member) => <option key={member.auth_user_id} value={member.auth_user_id}>{member.display_name}</option>)}</SelectField>
            </div>
            {form.sourceEventId && <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-[9px] font-bold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300">مرتبطة آليًا بإشارة تدقيق مركزية؛ ستختفي الإشارة من قائمة المراجعة بعد الحفظ.</div>}
            <button disabled={isSaving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-xs font-black text-white hover:bg-rose-700 disabled:opacity-40"><ShieldAlert className="h-4 w-4" />{isSaving ? 'جارٍ فتح الحادثة...' : 'فتح الحادثة وإدخالها لمسار الفريق'}</button>
          </form>
        </div>
      )}
    </div>
  );
}

function IncidentDetail(props: {
  incident: any;
  team: any[];
  selectedOwnerId: string;
  setSelectedOwnerId: (value: string) => void;
  workNote: string;
  setWorkNote: (value: string) => void;
  resolutionSummary: string;
  setResolutionSummary: (value: string) => void;
  rootCause: string;
  setRootCause: (value: string) => void;
  isSaving: boolean;
  onAssign: () => void;
  onComment: () => void;
  onResolve: () => void;
  onTransition: (status: string) => void;
  onClose: () => void;
  onReopen: () => void;
}) {
  const { incident } = props;
  return (
    <div className="sticky top-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 p-5 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2"><span className={`rounded-lg border px-2 py-1 text-[9px] font-black ${SEVERITY_META[incident.severity]?.className}`}>{SEVERITY_META[incident.severity]?.label}</span><span className="font-mono text-[10px] font-black text-slate-400">{incidentCode(incident)} • v{incident.version}</span></div>
        <h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">{incident.title}</h3>
        <p className="mt-2 text-[10px] font-bold leading-5 text-slate-500">{incident.description || 'لا يوجد وصف إضافي.'}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] font-bold"><DetailBox label="المدرسة" value={incident.school_name || 'نطاق المنصة'} /><DetailBox label="الحالة" value={STATUS_LABELS[incident.status]} /><DetailBox label="المسؤول" value={incident.owner_name || 'غير مسندة'} /><DetailBox label="موعد SLA" value={formatDate(incident.due_at)} danger={isBreached(incident)} /></div>
      </div>

      <div className="space-y-4 p-5">
        {!['resolved', 'closed'].includes(incident.status) && <div>
          <label className="text-[10px] font-black text-slate-600 dark:text-slate-300">إسناد لعضو الفريق</label>
          <div className="mt-1 flex gap-2"><select value={props.selectedOwnerId} onChange={(event) => props.setSelectedOwnerId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[10px] font-black dark:border-slate-700 dark:bg-slate-950"><option value="">اختر المسؤول</option>{props.team.map((member) => <option key={member.auth_user_id} value={member.auth_user_id}>{member.display_name}</option>)}</select><button type="button" disabled={props.isSaving} onClick={props.onAssign} className="rounded-xl bg-indigo-600 px-3 text-[10px] font-black text-white disabled:opacity-40">إسناد</button></div>
        </div>}

        <div>
          <label className="text-[10px] font-black text-slate-600 dark:text-slate-300">ملاحظة الفريق / نتيجة الفحص</label>
          <textarea rows={2} value={props.workNote} onChange={(event) => props.setWorkNote(event.target.value)} placeholder="ماذا تم فحصه؟ وما الخطوة التالية؟" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-[10px] font-bold dark:border-slate-700 dark:bg-slate-950" />
          <button type="button" disabled={props.isSaving} onClick={props.onComment} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[9px] font-black text-slate-700 dark:border-slate-700 dark:text-slate-300"><MessageSquare className="h-3.5 w-3.5" />إضافة للخط الزمني</button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(NEXT_ACTIONS[incident.status] || []).map((action) => <button key={action.status} type="button" disabled={props.isSaving} onClick={() => props.onTransition(action.status)} className="rounded-lg bg-slate-900 px-3 py-2 text-[9px] font-black text-white disabled:opacity-40 dark:bg-slate-700">{action.label}</button>)}
          {incident.status === 'resolved' && <button type="button" onClick={props.onClose} disabled={props.isSaving} className="rounded-lg bg-emerald-600 px-3 py-2 text-[9px] font-black text-white">إغلاق بعد التحقق</button>}
          {['resolved', 'closed'].includes(incident.status) && <button type="button" onClick={props.onReopen} disabled={props.isSaving} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[9px] font-black text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">إعادة فتح</button>}
        </div>

        {['in_progress', 'monitoring'].includes(incident.status) && (
          <details className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <summary className="cursor-pointer text-[10px] font-black text-emerald-800 dark:text-emerald-300">تسجيل الحل والسبب الجذري</summary>
            <div className="mt-3 space-y-2"><textarea rows={2} value={props.resolutionSummary} onChange={(event) => props.setResolutionSummary(event.target.value)} placeholder="ملخص ما تم إصلاحه وكيف تم التحقق" className="w-full rounded-xl border border-emerald-200 bg-white p-3 text-[10px] font-bold dark:border-emerald-900/50 dark:bg-slate-950" /><textarea rows={2} value={props.rootCause} onChange={(event) => props.setRootCause(event.target.value)} placeholder={['sev1', 'sev2'].includes(incident.severity) ? 'السبب الجذري (إلزامي لهذه الأولوية)' : 'السبب الجذري (اختياري لكنه مهم لمنع التكرار)'} className="w-full rounded-xl border border-emerald-200 bg-white p-3 text-[10px] font-bold dark:border-emerald-900/50 dark:bg-slate-950" /><button type="button" disabled={props.isSaving} onClick={props.onResolve} className="w-full rounded-xl bg-emerald-600 py-2.5 text-[10px] font-black text-white disabled:opacity-40">تسجيل المعالجة والانتقال للتحقق</button></div>
          </details>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between"><h4 className="text-[10px] font-black text-slate-700 dark:text-slate-200">الخط الزمني الكامل</h4><span className="text-[9px] font-bold text-slate-400">{incident.events?.length || 0} أحداث</span></div>
          <div className="max-h-64 space-y-2 overflow-y-auto border-r-2 border-slate-100 pr-3 dark:border-slate-800">{(incident.events || []).map((event: any) => <div key={event.id} className="relative rounded-xl bg-slate-50 p-3 text-[9px] dark:bg-slate-950/50"><span className="absolute -right-[18px] top-3 h-2.5 w-2.5 rounded-full border-2 border-white bg-indigo-500 dark:border-slate-900" /><div className="flex justify-between gap-2"><span className="font-black text-slate-800 dark:text-white">{EVENT_LABELS[event.event_type] || event.event_type}</span><span className="font-bold text-slate-400">{formatDate(event.created_at)}</span></div><div className="mt-1 font-bold text-indigo-700 dark:text-indigo-300">{event.actor_name}</div>{event.note && <div className="mt-1 leading-5 text-slate-500">{event.note}</div>}</div>)}</div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return <div className="border-l border-white/10 px-5 py-4 last:border-l-0"><div className="text-[9px] font-bold text-slate-400">{label}</div><div className={`mt-1 text-lg font-black ${tone}`}>{value}</div></div>;
}

function TeamLink({ icon, label, hint, onClick }: { icon: React.ReactNode; label: string; hint: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-indigo-100 bg-white p-3 text-right transition hover:border-indigo-300 dark:border-indigo-900/40 dark:bg-slate-900"><span className="text-indigo-600 dark:text-indigo-300">{icon}</span><span><span className="block text-[10px] font-black text-slate-800 dark:text-white">{label}</span><span className="mt-0.5 block text-[8px] font-bold text-slate-400">{hint}</span></span></button>;
}

function DetailBox({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return <div className={`rounded-xl p-2.5 ${danger ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' : 'bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-200'}`}><div className="text-[8px] text-slate-400">{label}</div><div className="mt-1 font-black">{value}</div></div>;
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="text-[10px] font-black text-slate-600 dark:text-slate-300">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-950">{children}</select></label>;
}
