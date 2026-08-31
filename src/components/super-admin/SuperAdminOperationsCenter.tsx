import { Activity, AlertCircle, AlertTriangle, ArrowRight, Building, Calendar, Check, CheckCircle, CheckCircle2, CheckSquare, ChevronDown, Clock, Copy, Cpu, Database, Download, Edit, ExternalLink, Eye, EyeOff, FileText, Filter, Globe, HardDrive, HelpCircle, Key, Landmark, Lock as LockIcon, Play, Plus, Receipt, RefreshCcw, RefreshCw, Save, Search, Server, Settings, ShieldAlert, ShieldCheck, Sliders, SlidersHorizontal, Square, Terminal, Trash, Unlock, UserCheck, Users, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { copyTextToClipboard } from '../SuperAdminView';
import { getTrustedSchoolUrl, openTrustedSchoolPortal } from '../../utils/EnterpriseDomainUtils';
import { authenticatedRequest } from '../../utils/authenticatedRequest';
import { toDisplayPlan, updateCanonicalTenantStatus, updateCanonicalTenantSubscription } from '../../utils/centralTenantSubscription';

interface SuperAdminOperationsCenterProps {
  schools: any[];
  setSchools: React.Dispatch<React.SetStateAction<any[]>>;
  branches: any[];
  tenants?: any[];
  setTenants?: React.Dispatch<React.SetStateAction<any[]>>;
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
  setSelectedSchool: (school: any) => void;
  setCurrentRole: (role: any) => void;
  setIsSuperAdminPortalActive: (v: boolean) => void;
  setCurrentPortal?: (portal: any) => void;
  onNavigateToTab?: (tab: string) => void;
}

export default function SuperAdminOperationsCenter({
  schools = [],
  setSchools,
  branches = [],
  tenants = [],
  setTenants,
  logAction,
  triggerNotification,
  setSelectedSchool,
  setCurrentRole,
  setIsSuperAdminPortalActive,
  setCurrentPortal,
  onNavigateToTab
}: SuperAdminOperationsCenterProps) {

  // Selected Tab inside Operations Center
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'subscriptions_modules' | 'backups' | 'support'>('overview');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Selected School for detailed actions
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || '');
  const activeSchool = schools.find(s => s.id === selectedSchoolId) || schools[0];

  // Link Management State
  const [newSubdomain, setNewSubdomain] = useState('');
  const [isEditingLink, setIsEditingLink] = useState(false);

  // Subscriptions Limits State
  const [tempPlan, setTempPlan] = useState('');
  const [tempUserLimit, setTempUserLimit] = useState('');
  const [tempStorageLimit, setTempStorageLimit] = useState('');
  const [tempEnd, setTempEnd] = useState('');

  // Impersonation state
  const [engineerName, setEngineerName] = useState('سليمان غازي');
  const [supportReason, setSupportReason] = useState('');
  const [isImpersonationSubmitting, setIsImpersonationSubmitting] = useState(false);

  // لا تُعرض لقطات أو مهام نسخ من دون موصل تخزين مركزي موثق.
  const backupLogs: any[] = [];

  // Keep state matching active school selection
  useEffect(() => {
    if (activeSchool) {
      const tenantId = activeSchool.tenantId || activeSchool.tenant_id;
      const tenant = tenants.find((item) => item.id === tenantId);
      setNewSubdomain(activeSchool.subdomain || '');
      setTempPlan(toDisplayPlan(tenant?.subscription?.planCode || tenant?.planCode || activeSchool.plan));
      setTempUserLimit(tenant?.subscription?.seatLimit ? String(tenant.subscription.seatLimit) : activeSchool.userLimit || '');
      setTempStorageLimit(activeSchool.storageLimit || '');
      setTempEnd(tenant?.subscription?.endsAt || activeSchool.subscriptionEnd || '');
    }
  }, [selectedSchoolId, activeSchool, tenants]);

  // Alerts Center State
  const alerts: any[] = [];

  const handleDismissAlert = (id: string) => {
    void id;
    triggerNotification('لا يوجد مصدر حوادث مركزي موثق للحذف أو الأرشفة؛ لم يتغير سجل التدقيق.', 'warning');
  };

  const handleResolveAlert = (alert: any) => {
    setSelectedSchoolId(alert.schoolId);
    if (alert.action === 'تجديد' || alert.action === 'ترقية') {
      setActiveTab('subscriptions_modules');
    } else if (alert.action === 'نسخ الآن') {
      setActiveTab('backups');
    } else {
      setActiveTab('support');
    }
    triggerNotification(`تم فتح مسار المعالجة المقترح للتنبيه: ${alert.category}. لم يُغلق التنبيه دون مصدر مركزي موثق.`, 'info');
  };

  const updateCentralSchool = async (school: any, profile: Record<string, unknown>, status?: string) => {
    if (!school?.id) throw new Error('يجب تحديد مدرسة من الدليل المركزي قبل الحفظ.');
    const response = await authenticatedRequest(`/api/admin/central/schools/${encodeURIComponent(school.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'update',
        name: school.name,
        schoolCode: school.schoolCode,
        ...(status ? { status } : {}),
        profile,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success || !payload?.school) {
      throw new Error(payload?.message || 'تعذر حفظ التغيير في الدليل المركزي.');
    }
    return payload.school;
  };

  const applyCanonicalSchool = (canonical: any) => {
    const profile = canonical.central_metadata && typeof canonical.central_metadata === 'object' ? canonical.central_metadata : {};
    const nextSchool = {
      ...profile,
      ...canonical,
      id: canonical.id,
      name: canonical.display_name,
      schoolCode: canonical.school_code,
      archived: canonical.status === 'archived',
      schoolUrl: getTrustedSchoolUrl({ ...profile, id: canonical.id }),
    };
    setSchools(prev => prev.map(item => item.id === canonical.id ? { ...item, ...nextSchool } : item));
  };

  const getTenantForSchool = (school: any) => {
    const tenantId = school?.tenantId || school?.tenant_id;
    return tenants.find((tenant) => tenant.id === tenantId) || null;
  };

  const activeTenant = getTenantForSchool(activeSchool);

  const applyCanonicalTenant = (canonicalTenant: any) => {
    setTenants?.((current) => current.map((tenant) => tenant.id === canonicalTenant.id ? { ...tenant, ...canonicalTenant } : tenant));
    setSchools((current) => current.map((school) => {
      const schoolTenantId = school.tenantId || school.tenant_id;
      if (schoolTenantId !== canonicalTenant.id || !canonicalTenant.subscription) return school;
      return {
        ...school,
        plan: toDisplayPlan(canonicalTenant.planCode),
        subscriptionStatus: canonicalTenant.subscription.status,
        subscriptionStart: canonicalTenant.subscription.startsAt,
        subscriptionEnd: canonicalTenant.subscription.endsAt,
        userLimit: canonicalTenant.subscription.seatLimit,
      };
    }));
  };

  const toggleModuleProperty = (schoolId: string, moduleKey: string, prop: 'active' | 'visible' | 'premium') => {
    void schoolId;
    void moduleKey;
    void prop;
    triggerNotification('إدارة وحدات المدرسة أصبحت متاحة من شاشة الميزات المركزية بعد ربطها بالدليل الموثوق؛ لم يتم تعديل أي إعداد محلي.', 'warning');
  };

  // Cloud Link Handler
  const handleUpdateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchool || !newSubdomain.trim()) {
      triggerNotification('اختر مدرسة وأدخل نطاقاً فرعياً صالحاً قبل الحفظ.', 'warning');
      return;
    }
    try {
      const canonical = await updateCentralSchool(activeSchool, { subdomain: newSubdomain.trim().toLowerCase() });
      applyCanonicalSchool(canonical);
      logAction('UPDATE_SUBDOMAIN', `تحديث النطاق الفرعي من مركز العمليات للمدرسة: ${activeSchool.name}`, 'إدارة أسماء النطاقات والروابط');
      triggerNotification('تم حفظ النطاق الفرعي في الدليل المركزي. فحص DNS/SSL ما زال يحتاج موصل البنية التحتية.', 'success');
      setIsEditingLink(false);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر حفظ النطاق؛ لم يتم تعديل البيانات.', 'danger');
    }
  };

  const handleRegenerateLink = () => {
    triggerNotification('إعادة توليد النطاق تحتاج موصل بنية تحتية مركزيًا؛ لم يتم تغيير الرابط أو تسجيل نجاح وهمي.', 'warning');
  };

  // Subscription Details Handler
  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchool) {
      triggerNotification('لا توجد مدرسة محددة للحفظ.', 'warning');
      return;
    }
    const tenant = getTenantForSchool(activeSchool);
    const currentStorageLimit = parseInt(String(activeSchool.storageLimit || ''), 10);
    const requestedStorageLimit = parseInt(String(tempStorageLimit || ''), 10);
    const storageChanged = Number.isFinite(currentStorageLimit) !== Number.isFinite(requestedStorageLimit)
      || (Number.isFinite(currentStorageLimit) && Number.isFinite(requestedStorageLimit) && currentStorageLimit !== requestedStorageLimit);
    if (storageChanged) {
      triggerNotification('تعديل السعة التخزينية يحتاج موصل تخزين مركزي موثق؛ لم يتم حفظ أي جزء من التعديل.', 'warning');
      return;
    }
    const seatLimit = Number(tempUserLimit);
    if (!tenant?.subscription || !Number.isSafeInteger(seatLimit) || seatLimit < 1) {
      triggerNotification('بيانات المستأجر أو حد المستخدمين غير مكتملة؛ لم يتم حفظ تعديل جزئي.', 'warning');
      return;
    }
    try {
      const canonicalTenant = await updateCanonicalTenantSubscription(tenant, {
        planCode: tempPlan.trim(),
        status: tenant.subscription.status === 'expired' ? 'active' : tenant.subscription.status,
        seatLimit,
        endsAt: tempEnd.trim() || null,
      });
      applyCanonicalTenant(canonicalTenant);
      logAction('UPDATE_SUBSCRIPTION', `حفظ اشتراك المدرسة من مركز العمليات: ${activeSchool.name}`, 'إدارة الاشتراكات والتراخيص');
      triggerNotification(`تم حفظ باقة وحد مقاعد اشتراك ${activeSchool.name} في الدليل المركزي. السعة التخزينية بقيت كما هي لأنها تحتاج موصل تخزين موثق.`, 'success');
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر حفظ الاشتراك؛ لم يتم تعديل البيانات.', 'danger');
    }
  };

  const handleSubscriptionQuickAction = async (actionType: 'renew' | 'suspend' | 'upgrade' | 'downgrade') => {
    if (!activeSchool) {
      triggerNotification('لا توجد مدرسة محددة لتنفيذ الإجراء.', 'warning');
      return;
    }
    const tenant = getTenantForSchool(activeSchool);
    if (!tenant?.subscription) {
      triggerNotification('لا يوجد اشتراك كانونى مرتبط بهذه المدرسة؛ افتح دليل المستأجرين أولاً.', 'warning');
      return;
    }
    const plans = ['Standard', 'Basic', 'Business', 'Enterprise'];
    const currentPlan = String(activeSchool.plan || tenant.planCode || 'Business').toLowerCase();
    const matchedPlanIndex = plans.findIndex((plan) => plan.toLowerCase() === currentPlan);
    const currentPlanIndex = matchedPlanIndex >= 0 ? matchedPlanIndex : 1;
    const targetPlan = actionType === 'upgrade'
      ? plans[Math.min(plans.length - 1, currentPlanIndex + 1)]
      : actionType === 'downgrade'
        ? plans[Math.max(0, currentPlanIndex - 1)]
        : plans[currentPlanIndex];
    const limits: Record<string, { storageLimit: string; userLimit: string }> = {
      Standard: { storageLimit: 'غير متحقق', userLimit: '100' },
      Basic: { storageLimit: '100 GB', userLimit: '1000' },
      Business: { storageLimit: '500 GB', userLimit: '3000' },
      Enterprise: { storageLimit: '1024 GB', userLimit: '5000' },
    };
    try {
      let canonicalTenant: any;
      if (actionType === 'suspend') {
        const nextStatus = tenant.status === 'suspended' ? 'active' : 'suspended';
        canonicalTenant = await updateCanonicalTenantStatus(tenant, nextStatus);
      } else {
        const seatLimit = Number(limits[targetPlan].userLimit);
        const rawEnd = tenant.subscription.endsAt || tenant.subscription.ends_at;
        if (!rawEnd) throw new Error('لا يوجد تاريخ نهاية كانوني للاشتراك؛ لم يتم تنفيذ الإجراء.');
        const currentEnd = new Date(rawEnd);
        if (Number.isNaN(currentEnd.getTime())) throw new Error('تاريخ نهاية الاشتراك الكانوني غير صالح؛ لم يتم تنفيذ الإجراء.');
        if (currentEnd.getTime() < Date.now()) currentEnd.setTime(Date.now());
        if (actionType === 'renew') {
          currentEnd.setMonth(currentEnd.getMonth() + 12);
        }
        canonicalTenant = await updateCanonicalTenantSubscription(tenant, {
          planCode: targetPlan,
          seatLimit,
          status: actionType === 'renew' ? 'active' : tenant.subscription.status,
          endsAt: currentEnd.toISOString().split('T')[0],
        });
      }
      applyCanonicalTenant(canonicalTenant);
      logAction(`CENTRAL_${actionType.toUpperCase()}_SUBSCRIPTION`, `تنفيذ إجراء ${actionType} مركزياً للمستأجر المرتبط بالمدرسة: ${activeSchool.name}`, 'إدارة الاشتراكات والتراخيص');
      const storageNotice = actionType === 'suspend'
        ? ''
        : ' السعة التخزينية لم تتغير لأنها تحتاج موصل تخزين موثق.';
      triggerNotification(`تم تنفيذ إجراء ${actionType} على ${activeSchool.name} عبر المصدر المركزي.${storageNotice}`, actionType === 'suspend' ? 'warning' : 'success');
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر تنفيذ الإجراء؛ لم يتم تعديل البيانات.', 'danger');
    }
  };

  // Impersonation requires a short-lived server-issued session and audit trail.
  const handleStartImpersonate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportReason.trim() || !engineerName.trim()) {
      triggerNotification('يرجى تحديد اسم المسؤول وسبب الدخول الفني', 'warning');
      return;
    }

    setIsImpersonationSubmitting(false);
    triggerNotification('جلسة الدعم الفني تحتاج إصدار رمز مركزي قصير العمر وتسجيل تدقيق؛ لم يتم فتح جلسة محلية.', 'warning');
  };

  // Backups require a real storage connector and server-side snapshot job.
  const handleCreateBackup = () => {
    triggerNotification('إنشاء النسخ الاحتياطية يحتاج موصل تخزين مركزيًا ومهمة خادم موثقة؛ لم يتم إنشاء نسخة محلية أو تسجيل نجاح.', 'warning');
  };

  const handleRestoreBackup = (b: any) => {
    const isConfirmed = window.confirm(`⚠️ تحذير: هل أنت متأكد من استعادة النسخة الاحتياطية المؤرخة في [${b.date}]؟ سيتم الكتابة فوق قاعدة البيانات الحالية لـ ${b.schoolName} بالكامل ولا يمكن التراجع!`);
    if (!isConfirmed) return;

    triggerNotification(`استعادة نسخة ${b.schoolName} تحتاج مهمة خادم مركزية مع تحقق مزدوج؛ لم يتم تغيير قاعدة البيانات.`, 'warning');
  };

  const handleVerifyIntegrity = (b: any) => {
    triggerNotification(`فحص سلامة النسخة [${b.id}] يحتاج قراءة فعلية من مخزن النسخ؛ لم تُعلن نتيجة وهمية.`, 'warning');
  };

  // Quick Stats Computations: tenant lifecycle values come from the canonical tenant directory.
  const totalSchools = schools.length;
  const totalTenants = tenants.length;
  const activeTenantsCount = tenants.filter(tenant => tenant.status === 'active').length;
  const suspendedTenantsCount = tenants.filter(tenant => tenant.status === 'suspended' || tenant.status === 'archived').length;
  const trialTenantsCount = tenants.filter(tenant => tenant.subscription?.status === 'trial').length;
  const expiredTenantsCount = tenants.filter(tenant => {
    if (tenant.subscription?.status === 'expired') return true;
    const endsAt = tenant.subscription?.endsAt || tenant.subscription?.ends_at;
    if (!endsAt) return false;
    const timestamp = Date.parse(String(endsAt));
    return Number.isFinite(timestamp) && timestamp < Date.now();
  }).length;
  // Filter schools list based on search and tab selections
  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          school.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          school.managerName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || school.status === statusFilter;
    const matchesPlan = planFilter === 'all' || school.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleExportCSV = () => {
    const headers = ['اسم المدرسة', 'المعرف', 'النطاق الفرعي', 'الباقة', 'الحالة', 'المدير المسؤول', 'البريد الإلكتروني'];
    const rows = filteredSchools.map(s => [s.name, s.id, s.subdomain, s.plan, s.status, s.managerName, s.email]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `operations_center_tenants_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification('تم تصدير تقرير المستأجرين بصيغة CSV بنجاح', 'success');
  };

  const handlePrintTable = () => {
    window.print();
  };

  const subscriptionChartData: { name: string; value: number; color: string }[] = [];
  const schoolModules: Record<string, { active: boolean | null; visible: boolean | null; premium: boolean | null }> = {};

  const availableModules = [
    { key: 'students', label: 'الطلاب والقبول والتسجيل', icon: Users, desc: 'إدارة ملفات الطلاب الأكاديمية والشخصية والصحية.' },
    { key: 'employees', label: 'الكوادر البشرية والرواتب', icon: UserCheck, desc: 'تنظيم الحضور والانصراف، مسيرات الرواتب، وملفات الكوادر.' },
    { key: 'accounts', label: 'النظام المالي والحسابات الدفترية', icon: Landmark, desc: 'إدارة السندات، الخزائن، شجرة الحسابات، والمطالبات المالية.' },
    { key: 'transport', label: 'أسطول النقل والمواصلات المدرسية', icon: Building, desc: 'جدولة خطوط النقل والحافلات واشتراكات الطلاب والمسارات.' },
    { key: 'exams', label: 'الامتحانات والشهادات والتقييم الأكاديمي', icon: FileText, desc: 'محرك الاختبارات المركزي، رصد الدرجات، وبطاقات التقييم السنوية.' },
    { key: 'inventory', label: 'المستودعات والمشتريات والعهدة', icon: HardDrive, desc: 'إدارة المخزون المدرسي، عهدة المعلمين والطلبة، ومبيعات الزي الموحد.' }
  ];

  return (
    <div className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6" id="super-admin-operations-center" dir="rtl">

      {/* ================= HEADER: BRAND BANNER & TELEMETRY PILLS ================= */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-[#d4af37]/40 bg-gradient-to-r from-[#1c120c] via-[#2d1e12] to-[#1a100a] p-5 text-white shadow-2xl sm:p-6">
        {/* Glow decorative background elements */}
        <div className="absolute -top-12 -right-12 w-72 h-72 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/4 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] tracking-widest text-amber-400 font-black uppercase font-mono">EduPro Enterprise School ERP</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight">
              لوحة التحكم والرقابة المركزية الموحدة
            </h2>
            <p className="text-xs text-amber-100/80 mt-2 max-w-3xl leading-relaxed">
              منصة التحكم المركزية والحوكمة السيادية لمنظومة EduPro: إدارة المستأجرين والمدارس والفروع، وتراخيص الوحدات التنظيمية، مع عرض واضح لما هو موصول وما يحتاج إلى موصل بنية تحتية.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2.5 rounded-2xl border border-[#d4af37]/20 bg-[#2a1d13]/90 p-2 backdrop-blur-md">
            <div className="text-[10px] font-mono font-bold bg-[#1c120c] border border-[#d4af37]/20 text-amber-100 px-3 py-2 rounded-xl flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-amber-400" />
              <span>مصدر المراقبة:</span>
              <span className="text-amber-300">غير متصل</span>
            </div>
            <div className="text-[10px] font-mono font-bold bg-[#1c120c] border border-[#d4af37]/20 text-emerald-200 px-3 py-2 rounded-xl flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>زمن الاستجابة:</span>
              <span className="text-amber-300">غير متحقق</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= STATISTICAL CARDS WITH HOVER ANIMATION ================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Card 1: Total Tenants */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/25 rounded-3xl p-5 hover:shadow-lg hover:border-[#d4af37] transition-all duration-300 relative group cursor-pointer overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-600 dark:bg-amber-500 rounded-r-2xl" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase tracking-wider">إجمالي المستأجرين</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalTenants}</h3>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold">
            <span>{totalSchools} مدرسة تابعة في الدليل المركزي</span>
          </div>
        </div>

        {/* Card 2: Active Tenants */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/25 rounded-3xl p-5 hover:shadow-lg hover:border-[#d4af37] transition-all duration-300 relative group cursor-pointer overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500 rounded-r-2xl" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase tracking-wider">المستأجرون النشطون</span>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{activeTenantsCount}</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-black">
            <span>من حالة المستأجر والاشتراك المسجلين</span>
          </div>
        </div>

        {/* Card 3: Suspended Tenants */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/25 rounded-3xl p-5 hover:shadow-lg hover:border-[#d4af37] transition-all duration-300 relative group cursor-pointer overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500 rounded-r-2xl" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase tracking-wider">المستأجرون الموقوفون</span>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{suspendedTenantsCount}</h3>
            </div>
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
              <X className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-black">
            <span>تعكس حالة الدليل المركزي فقط</span>
          </div>
        </div>

        {/* Card 4: Trial Tenants */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/25 rounded-3xl p-5 hover:shadow-lg hover:border-[#d4af37] transition-all duration-300 relative group cursor-pointer overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-orange-500 rounded-r-2xl" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase tracking-wider">الاشتراكات التجريبية</span>
              <h3 className="text-2xl font-black text-orange-600 dark:text-orange-400 font-mono">{trialTenantsCount}</h3>
            </div>
            <div className="p-2.5 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-orange-600 dark:text-orange-400 font-black">
            <span>من حالة الاشتراك القانونية</span>
          </div>
        </div>

        {/* Card 5: Expired Subscriptions */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/25 rounded-3xl p-5 hover:shadow-lg hover:border-[#d4af37] transition-all duration-300 relative group cursor-pointer overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500 rounded-r-2xl" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase tracking-wider">الاشتراكات المنتهية</span>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{expiredTenantsCount}</h3>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-black">
            <span>تتطلب مراجعة مركزية</span>
          </div>
        </div>

        {/* Card 6: Connected Active Sessions */}
        <div className="bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/25 rounded-3xl p-5 hover:shadow-lg hover:border-[#d4af37] transition-all duration-300 relative group cursor-pointer overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-violet-500 rounded-r-2xl" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase tracking-wider">المستخدمون النشطون</span>
              <h3 className="text-lg font-black text-amber-600 dark:text-amber-400">غير متحقق</h3>
            </div>
            <div className="p-2.5 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-colors duration-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-500 font-black">
            <span>موصل الجلسات المركزية غير متاح</span>
          </div>
        </div>

      </div>

      {/* ================= SUB-NAVIGATION TABS (PILLS LAYOUT) ================= */}
      <div className="flex flex-wrap bg-slate-100/60 dark:bg-slate-950/80 p-1.5 border border-slate-200/60 dark:border-slate-800/50 gap-1 backdrop-blur-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
            activeTab === 'overview' 
              ? 'dark:bg-slate-900 text-amber-600 dark:text-amber-400 border border-slate-200/50 dark:border-slate-800/50' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-900/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>الرقابة والمؤشرات الإستراتيجية</span>
        </button>
        <button
          onClick={() => setActiveTab('links')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
            activeTab === 'links' 
              ? 'dark:bg-slate-900 text-amber-600 dark:text-amber-400 border border-slate-200/50 dark:border-slate-800/50' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-900/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>الروابط السحابية والـ DNS</span>
        </button>
        <button
          onClick={() => setActiveTab('subscriptions_modules')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
            activeTab === 'subscriptions_modules' 
              ? 'dark:bg-slate-900 text-amber-600 dark:text-amber-400 border border-slate-200/50 dark:border-slate-800/50' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-900/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>الاشتراكات وترخيص الوحدات</span>
        </button>
        <button
          onClick={() => setActiveTab('backups')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
            activeTab === 'backups' 
              ? 'dark:bg-slate-900 text-amber-600 dark:text-amber-400 border border-slate-200/50 dark:border-slate-800/50' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-900/60'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>مركز النسخ والتعافي السحابي</span>
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
            activeTab === 'support' 
              ? 'dark:bg-slate-900 text-amber-600 dark:text-amber-400 border border-slate-200/50 dark:border-slate-800/50' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-900/60'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>الدعم والولوج الإداري</span>
        </button>
      </div>

      {/* ================= MAIN WORKSPACE FRAME WITH FRAMER MOTION TRANSITIONS ================= */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            
            {/* ================= TAB 1: OVERVIEW & BENTO GRID LAYOUT ================= */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Bento Grid Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Widget 1: Subscriptions Status Pie Chart */}
                  <div className="lg:col-span-4 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-150 dark:border-slate-850 pb-4">
                        <Receipt className="w-4 h-4 text-amber-500" />
                        توزيع باقات التراخيص الفعالة
                      </h3>
                      
                      <div className="h-44 relative mt-3">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                            <Pie
                              data={subscriptionChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={72}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {subscriptionChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => [`${value}%`, 'النسبة الإجمالية']}
                              contentStyle={{ 
                                direction: 'rtl', 
                                textAlign: 'right', 
                                backgroundColor: '#0f172a', 
                                borderRadius: '12px',
                                border: '1px solid #1e293b',
                                color: '#fff',
                                fontSize: '11px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                              }} 
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase">بيانات التوزيع</span>
                          <span className="text-sm font-black text-amber-500">غير متحققة</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mt-5 pt-4 border-t border-slate-150 dark:border-slate-850">
                      {subscriptionChartData.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-slate-600 dark:text-slate-400 font-bold tracking-tight">{item.name}</span>
                          </div>
                          <span className="font-mono font-black text-slate-900 dark:text-slate-100">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Widget 2: Direct Monitoring & Real-time Telemetry */}
                  <div className="lg:col-span-5 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-150 dark:border-slate-850 pb-4">
                        <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                        مؤشرات الصحة والاتصال المسجلة
                      </h3>

                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-black uppercase">حالة الخوادم المركزية</span>
                          <span className="text-xs font-black text-slate-900 dark:text-white font-mono flex items-center gap-1.5 mt-1.5">
                            غير متحقق من موصل المراقبة
                          </span>
                        </div>
                        <div className="p-3 bg-transparent dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-black uppercase">جلسات الدخول الجارية</span>
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono mt-1.5 block">
                            غير متحقق
                          </span>
                        </div>
                      </div>

                      {/* Telemetry metrics bar list */}
                      <div className="space-y-4 mt-5">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-bold">استهلاك طاقة المعالجة (CPU Load)</span>
                            <span className="text-amber-600 dark:text-amber-400 font-black">غير متحقق</span>
                          </div>
                          <div className="text-[9px] text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-center">
                            لا توجد قراءة موثقة
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-bold">توزيع الذاكرة العشوائية (RAM Usage)</span>
                            <span className="text-amber-600 dark:text-amber-400 font-black">غير متحقق</span>
                          </div>
                          <div className="text-[9px] text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-center">
                            لا توجد قراءة موثقة
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-bold">قاعدة بيانات الفيدرالية</span>
                            <span className="text-xs text-amber-500 font-extrabold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              غير متحقق من موصل قاعدة البيانات
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sparkline CPU Hist */}
                    <div className="mt-5 pt-4 border-t border-slate-150 dark:border-slate-850 text-[10px] text-slate-400 dark:text-slate-500 flex justify-between items-center">
                      <span className="font-black uppercase tracking-wider">مخطط التردد والذبذبات اللحظي:</span>
                      <span className="text-amber-500 font-bold">لا توجد سلسلة قياس موثقة</span>
                    </div>
                  </div>

                  {/* Widget 3: Critical Operations Alerts */}
                  <div className="lg:col-span-3 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-150 dark:border-slate-850 pb-4">
                        <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                        تنبيهات الأمن والامتثال
                      </h3>

                      <div className="space-y-2.5 mt-3.5 max-h-[210px] overflow-y-auto pr-1">
                        {alerts.map((a) => (
                          <div 
                            key={a.id}
                            className={`p-3 border text-right text-xs transition-all flex flex-col gap-1.5 ${
                              a.type === 'danger' 
                                ? 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30' 
                                : 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                a.type === 'danger' 
                                  ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50' 
                                  : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50'
                              }`}>
                                {a.category}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleResolveAlert(a)}
                                  className="text-[9px] font-black text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                                >
                                  معالجة
                                </button>
                                <span className="text-slate-300 dark:text-slate-800">|</span>
                                <button
                                  onClick={() => handleDismissAlert(a.id)}
                                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-[11px] font-black text-slate-900 dark:text-white leading-snug">{a.title}</h4>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed mt-1">{a.desc}</p>
                            </div>
                          </div>
                        ))}
                        {alerts.length === 0 && (
                          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                            <AlertTriangle className="w-8 h-8 text-amber-500" />
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">لا توجد بيانات حوادث موثقة؛ حالة الأنظمة غير متحققة</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex justify-end">
                      <button 
                        onClick={() => {
                          triggerNotification('موصل التحقق الذاتي للمخدمات غير متاح؛ لم يبدأ أي فحص.', 'warning');
                        }}
                        className="text-[10px] font-black text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        عرض جميع السجلات الأمنية ←
                      </button>
                    </div>
                  </div>

                </div>

                {/* Bento Grid Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Table Component: Recently Added Tenants */}
                  <div className="lg:col-span-6 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-850 pb-4">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Server className="w-4 h-4 text-amber-500" />
                        أحدث المدارس والـ Tenants المضافة
                      </h3>
                      <button 
                        onClick={() => setActiveTab('links')}
                        className="text-xs font-black text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      >
                        إدارة الكل ←
                      </button>
                    </div>

                    <div className="overflow-x-auto mt-4 border border-slate-150 dark:border-slate-850 shadow-2xs">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-150 dark:border-slate-850 bg-transparent dark:bg-slate-950 text-[10px] font-black uppercase tracking-wider">
                            <th className="p-4 font-black text-center w-12">#</th>
                            <th className="p-4 font-black">المدرسة والنطاق</th>
                            <th className="p-4 font-black">الباقة</th>
                            <th className="p-4 font-black">تاريخ الانضمام</th>
                            <th className="p-4 font-black">حالة الخدمة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                          {schools.slice(0, 4).map((s, idx) => (
                            <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-all duration-200 group">
                              <td className="p-4 text-center text-slate-500 dark:text-slate-400 font-mono font-black bg-slate-50/40 dark:bg-slate-950/10">{idx + 1}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <span className="text-base select-none">{s.logo}</span>
                                  <div>
                                    <span className="font-extrabold text-slate-900 dark:text-slate-100 block">{s.name}</span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block mt-0.5">{s.subdomain}.erpcloud.com</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black border ${
                                  s.plan === 'Enterprise' 
                                    ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100/50 dark:border-purple-900/30' 
                                    : s.plan === 'Business'
                                    ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-100/50 dark:border-orange-900/30'
                                    : 'bg-transparent dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-150 dark:border-slate-800'
                                }`}>
                                  {s.plan}
                                </span>
                              </td>
                              <td className="p-4 font-mono text-slate-500 dark:text-slate-400 font-bold">{s.lastLogin || 'غير متحقق'}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black border ${
                                  s.status === 'active' 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/30' 
                                    : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100/50 dark:border-amber-900/30'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                  {s.status === 'active' ? 'نشط بالكامل' : 'مجمد مؤقتاً'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Cluster Resources Progress */}
                  <div className="lg:col-span-3 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 hover:shadow-md transition-all duration-300">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <HardDrive className="w-4 h-4 text-amber-500" />
                      استهلاك موارد السحابة الإجمالي
                    </h3>

                    <div className="space-y-4 mt-4">
                      {/* Gauge 1 */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-bold">الطلاب الإجماليين في النظام</span>
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">غير متحقق</span>
                        </div>
                        <div className="text-[9px] text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-center">
                          لا توجد قراءة موثقة
                        </div>
                      </div>

                      {/* Gauge 2 */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-bold">تراخيص المستخدمين والكوادر</span>
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">غير متحقق</span>
                        </div>
                        <div className="text-[9px] text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-center">
                          لا توجد قراءة موثقة
                        </div>
                      </div>

                      {/* Gauge 3 */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-bold">مساحة قواعد البيانات (Postgres)</span>
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">غير متحقق</span>
                        </div>
                        <div className="text-[9px] text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-center">
                          لا توجد قراءة موثقة
                        </div>
                      </div>

                      {/* Gauge 4 */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-bold">تخزين وسائط الطلاب S3</span>
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">غير متحقق</span>
                        </div>
                        <div className="text-[9px] text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-center">
                          لا توجد قراءة موثقة
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Terminal SysLogs Console */}
                  <div className="lg:col-span-3 bg-slate-950 border border-slate-900 p-5 text-left flex flex-col justify-between overflow-hidden">
                    <div>
                      <h3 className="text-xs font-black text-slate-200 flex items-center gap-2 border-b border-slate-850 pb-3" dir="rtl">
                        <Terminal className="w-4 h-4 text-amber-400" />
                        لوحة تدفق السجلات والمراقبة
                      </h3>
                      
                      <div className="space-y-2 font-mono text-[9px] text-slate-300 h-36 overflow-y-auto pt-3 select-text scrollbar-thin pr-1" dir="rtl">
                        <div className="p-2 text-amber-400 leading-relaxed">
                          لا توجد سجلات تشغيل حية موثقة. يلزم ربط موصل السجلات المركزي.
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-850 flex justify-between items-center" dir="rtl">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        <span className="text-[9px] text-slate-500 font-bold">المصدر غير متصل</span>
                      </div>
                      <span className="text-[8px] text-amber-400 font-bold">لا توجد بيانات</span>
                    </div>
                  </div>

                </div>

                {/* Quick Actions Bar */}
                <div className="dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 hover:shadow-md transition-all duration-300">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Sliders className="w-4 h-4 text-amber-500" />
                    العمليات والتحكمات السريعة للنظام
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-4">
                    <button 
                      onClick={() => {
                        onNavigateToTab?.('schools');
                        triggerNotification('تم فتح دليل المدارس المركزي؛ استخدم زر إضافة مدرسة لبدء التهيئة الذرية.', 'info');
                      }}
                      className="p-3.5 bg-amber-50/40 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-100/50 dark:border-amber-900/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-md active:scale-[0.98] cursor-pointer flex flex-col items-center gap-2 text-center text-[10px] font-black"
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                      <span>إنشاء مدرسة جديدة</span>
                    </button>

                    <button 
                      onClick={() => {
                        onNavigateToTab?.('users');
                        triggerNotification('تم فتح دليل المستخدمين المركزي لإدارة الهوية والصلاحيات.', 'info');
                      }}
                      className="p-3.5 bg-amber-50/40 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-100/50 dark:border-amber-900/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-md active:scale-[0.98] cursor-pointer flex flex-col items-center gap-2 text-center text-[10px] font-black"
                    >
                      <Users className="w-4 h-4 shrink-0" />
                      <span>إضافة مستخدم</span>
                    </button>

                    <button 
                      onClick={() => {
                        onNavigateToTab?.('subscriptions');
                        triggerNotification('تم فتح إدارة الاشتراكات المركزية؛ التغييرات تحفظ عبر المصدر الموثق.', 'info');
                      }}
                      className="p-3.5 bg-amber-50/40 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-100/50 dark:border-amber-900/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-md active:scale-[0.98] cursor-pointer flex flex-col items-center gap-2 text-center text-[10px] font-black"
                    >
                      <Receipt className="w-4 h-4 shrink-0" />
                      <span>أتمتة الاشتراكات</span>
                    </button>

                    <button 
                      onClick={() => {
                        onNavigateToTab?.('features');
                        triggerNotification('تم فتح مصفوفة الميزات المركزية؛ التفعيل لا يتم إلا بعد الحفظ في الدليل.', 'info');
                      }}
                      className="p-3.5 bg-amber-50/40 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-100/50 dark:border-amber-900/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-md active:scale-[0.98] cursor-pointer flex flex-col items-center gap-2 text-center text-[10px] font-black"
                    >
                      <Sliders className="w-4 h-4 shrink-0" />
                      <span>إدارة مصفوفة الوحدات</span>
                    </button>

                    <button 
                      onClick={() => {
                        onNavigateToTab?.('domains');
                        triggerNotification('تم فتح إدارة الروابط المركزية؛ حفظ البيانات متاح وفحص DNS/SSL يحتاج موصلاً.', 'info');
                      }}
                      className="p-3.5 bg-amber-50/40 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-100/50 dark:border-amber-900/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-md active:scale-[0.98] cursor-pointer flex flex-col items-center gap-2 text-center text-[10px] font-black"
                    >
                      <Globe className="w-4 h-4 shrink-0" />
                      <span>إدارة الروابط السحابية</span>
                    </button>

                    <button 
                      onClick={() => {
                        onNavigateToTab?.('resources');
                        triggerNotification('تم فتح التقارير والموارد؛ المؤشرات تظهر فقط عند توفر قراءات مركزية موثقة.', 'info');
                      }}
                      className="p-3.5 bg-amber-50/40 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-100/50 dark:border-amber-900/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-md active:scale-[0.98] cursor-pointer flex flex-col items-center gap-2 text-center text-[10px] font-black"
                    >
                      <HardDrive className="w-4 h-4 shrink-0" />
                      <span>التقارير الإحصائية</span>
                    </button>

                    <button 
                      onClick={() => {
                        onNavigateToTab?.('backups');
                        triggerNotification('تم فتح مركز النسخ والتعافي؛ التنفيذ محجوب حتى ربط مخزن مركزي موثق.', 'warning');
                      }}
                      className="p-3.5 bg-amber-50/40 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-100/50 dark:border-amber-900/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-md active:scale-[0.98] cursor-pointer flex flex-col items-center gap-2 text-center text-[10px] font-black"
                    >
                      <Database className="w-4 h-4 shrink-0" />
                      <span>النسخ والتعافي</span>
                    </button>

                    <button 
                      onClick={() => {
                        onNavigateToTab?.('health');
                        triggerNotification('تم فتح سلامة النظام؛ قراءات البنية التحتية تحتاج موصل مراقبة مركزي.', 'warning');
                      }}
                      className="p-3.5 bg-amber-50/40 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-100/50 dark:border-amber-900/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-md active:scale-[0.98] cursor-pointer flex flex-col items-center gap-2 text-center text-[10px] font-black"
                    >
                      <Settings className="w-4 h-4 shrink-0" />
                      <span>الإعدادات العامة</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* ================= TAB 2: CLOUD LINK MANAGEMENT ================= */}
            {activeTab === 'links' && (
              <div className="dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 space-y-6 hover:shadow-md transition-all duration-300">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-amber-500" />
                      إدارة الروابط السحابية والـ DNS والشهادات
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      قم بإنشاء وتعديل واختبار روابط Tenants الفرعية. تضمن الخوارزمية المركزية تفرد الرابط السحابي للـ Tenant.
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100/40 dark:border-amber-900/30 px-3 py-1.5 rounded-lg font-mono">
                    Active Link: {activeSchool?.subdomain}.erpcloud.com
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* School Selector on right */}
                  <div className="md:col-span-4 space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">اختر المستأجر المستهدف (Active Tenant)</label>
                    <div className="space-y-1.5 max-h-[340px] overflow-y-auto bg-transparent dark:bg-slate-950 p-2 border border-slate-200/40 dark:border-slate-850">
                      {schools.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSchoolId(s.id)}
                          className={`w-full text-right p-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-between cursor-pointer border hover:scale-[1.01] active:scale-[0.99] ${
                            selectedSchoolId === s.id 
                              ? 'bg-amber-600 text-white border-amber-500' 
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60 border-transparent'
                          }`}
                        >
                          <span>{s.name}</span>
                          <span className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* DNS details form */}
                  <div className="md:col-span-8 space-y-4">
                    <div className="bg-transparent dark:bg-slate-950 p-5 border border-slate-200/50 dark:border-slate-850 space-y-4">
                      <h4 className="text-xs font-black text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <Settings className="w-3.5 h-3.5 text-amber-400" />
                        إعدادات خادم التوجيه للمدرسة: {activeSchool?.name}
                      </h4>

                      {isEditingLink ? (
                        <form onSubmit={handleUpdateLink} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">النطاق الفرعي الفريد (Unique Subdomain)</label>
                              <div className="flex dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2.5 text-xs font-mono focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-amber-500 transition-all" dir="ltr">
                                <input
                                  required
                                  type="text"
                                  value={newSubdomain}
                                  onChange={(e) => setNewSubdomain(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                                  className="bg-transparent text-slate-900 dark:text-white border-0 p-0 focus:ring-0 w-full font-mono font-bold text-right outline-none"
                                />
                                <span className="text-slate-400 ml-1">.erpcloud.com</span>
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">الرابط السحابي الكامل</label>
                              <div className="bg-slate-100 dark:bg-slate-900/60 p-3 border border-slate-200/55 dark:border-slate-850 text-slate-500 dark:text-slate-400 font-mono text-[10px] overflow-hidden truncate" dir="ltr">
                                https://{newSubdomain || '...'}.erpcloud.com
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setIsEditingLink(false)}
                              className="px-3.5 py-2 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 text-xs font-bold transition-all hover:bg-transparent dark:hover:bg-slate-950 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                            >
                              إلغاء التعديل
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-lg transition-all flex items-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>حفظ وتطبيق الرابط السحابي</span>
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1 dark:bg-slate-900 p-3 rounded-lg border border-slate-150 dark:border-slate-850">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold">النطاق السحابي الموجه:</span>
                              <span className="font-mono text-amber-600 dark:text-amber-400 text-xs font-black block mt-1">{activeSchool?.domain || `${activeSchool?.subdomain}.erpcloud.com`}</span>
                            </div>
                            <div className="space-y-1 dark:bg-slate-900 p-3 rounded-lg border border-slate-150 dark:border-slate-850">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold">حالة الـ SSL والاتصال:</span>
                              <span className="text-xs text-amber-500 font-extrabold flex items-center gap-1 mt-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                غير متحقق من موصل DNS وSSL المركزي
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                            <button
                              type="button"
                              onClick={() => setIsEditingLink(true)}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>تعديل وتغيير الرابط</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleRegenerateLink}
                              className="dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-white px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer hover:bg-transparent dark:hover:bg-slate-950"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                              <span>إعادة توليد وتأمين الرابط</span>
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const trustedUrl = getTrustedSchoolUrl(activeSchool);
                                try {
                                  if (navigator.clipboard && navigator.clipboard.writeText) {
                                    await navigator.clipboard.writeText(trustedUrl);
                                    triggerNotification('تم نسخ رابط المدرسة بنجاح.', 'success');
                                    return;
                                  }
                                  const textArea = document.createElement("textarea");
                                  textArea.value = trustedUrl;
                                  textArea.style.position = "fixed";
                                  textArea.style.opacity = "0";
                                  document.body.appendChild(textArea);
                                  textArea.focus();
                                  textArea.select();
                                  const successful = document.execCommand('copy');
                                  document.body.removeChild(textArea);
                                  if (successful) {
                                    triggerNotification('تم نسخ رابط المدرسة بنجاح.', 'success');
                                  } else {
                                    throw new Error('fallback failed');
                                  }
                                } catch (err) {
                                  triggerNotification('تعذر النسخ التلقائي. يرجى النسخ اليدوي للرابط: ' + trustedUrl, 'danger');
                                }
                              }}
                              className="dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-white px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer hover:bg-transparent dark:hover:bg-slate-950"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>نسخ الرابط الآمن</span>
                            </button>
                            <a
                              href={getTrustedSchoolUrl(activeSchool)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-white" />
                              <span>فتح الرابط مباشرة 🔒</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                triggerNotification('اختبار DNS وSSL متاح من شاشة النطاقات المركزية عند توفر الموصل؛ لم تُعلن نتيجة غير موثقة.', 'warning');
                              }}
                              className="dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-white px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer hover:bg-transparent dark:hover:bg-slate-950"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              <span>اختبار التوجيه والـ SSL</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 3: SUBSCRIPTIONS & MODULES MATRIX ================= */}
            {activeTab === 'subscriptions_modules' && (
              <div className="space-y-6">
                
                {/* Limits Form Block */}
                <div className="dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 space-y-6 hover:shadow-md transition-all duration-300">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-amber-500" />
                        إدارة تراخيص الباقات والوحدات (Modules Authorization Matrix)
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        حدد خطة الأسعار والحدود المسموح بها من المستخدمين والتخزين، وتحكم في إظهار أو حجب الموديولات عن المدرسة التابعة.
                      </p>
                    </div>
                    <div className="bg-amber-50/60 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100/40 dark:border-amber-900/30 px-3 py-1.5 rounded-lg text-xs font-black">
                      المستأجر الحالي: {activeSchool?.name}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* School Selector */}
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">اختر المستأجر لترخيص ميزاته</label>
                      <div className="space-y-1.5 max-h-[300px] overflow-y-auto bg-transparent dark:bg-slate-950 p-2 border border-slate-200/40 dark:border-slate-850">
                        {schools.map(s => (
                          <button
                            key={s.id}
                            onClick={() => setSelectedSchoolId(s.id)}
                            className={`w-full text-right p-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-between cursor-pointer border hover:scale-[1.01] active:scale-[0.99] ${
                              selectedSchoolId === s.id 
                                ? 'bg-amber-600 text-white border-amber-500' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60 border-transparent'
                            }`}
                          >
                            <span>{s.name}</span>
                            <span className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subscriptions configuration forms */}
                    <div className="md:col-span-8 space-y-4">
                      <form onSubmit={handleSaveSubscription} className="bg-transparent dark:bg-slate-950 p-5 border border-slate-200/50 dark:border-slate-850 space-y-4">
                        <h4 className="text-xs font-black text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                          محددات الترخيص والاستهلاك لـ {activeSchool?.name}
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1.5">باقة اشتراك المدرسة:</label>
                            <select 
                              value={tempPlan}
                              onChange={(e) => setTempPlan(e.target.value)}
                              className="w-full dark:bg-slate-900 text-slate-900 dark:text-slate-200 rounded-lg border border-slate-200/80 dark:border-slate-800 p-2.5 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
                            >
                              <option value="Standard">Standard (الباقة القياسية)</option>
                              <option value="Enterprise">Enterprise (الباقة السيادية الممتازة)</option>
                              <option value="Business">Business (باقة الأعمال الاحترافية)</option>
                              <option value="Basic">Basic (الباقة الأساسية للنمو)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1.5">تاريخ انتهاء الترخيص:</label>
                            <input 
                              type="date"
                              value={tempEnd}
                              onChange={(e) => setTempEnd(e.target.value)}
                              className="w-full dark:bg-slate-900 text-slate-900 dark:text-slate-200 rounded-lg border border-slate-200/80 dark:border-slate-800 p-2 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1.5">الحد الأقصى للمستخدمين والكوادر:</label>
                            <input 
                              type="text"
                              value={tempUserLimit}
                              onChange={(e) => setTempUserLimit(e.target.value)}
                              className="w-full dark:bg-slate-900 text-slate-900 dark:text-slate-200 rounded-lg border border-slate-200/80 dark:border-slate-800 p-2.5 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1.5">المساحة التخزينية المخصصة (تحتاج موصل S3):</label>
                            <input 
                              type="text"
                              value={tempStorageLimit}
                              onChange={(e) => setTempStorageLimit(e.target.value)}
                              className="w-full dark:bg-slate-900 text-slate-900 dark:text-slate-200 rounded-lg border border-slate-200/80 dark:border-slate-800 p-2.5 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
                            />
                          </div>
                        </div>

                        {/* Quick subscription actions */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-850 space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">إجراءات إدارية مستعجلة للمستأجر:</span>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleSubscriptionQuickAction('renew')}
                              className="px-3.5 py-2 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30 text-[10px] font-black rounded-lg cursor-pointer transition-all hover:bg-emerald-600 hover:text-white active:scale-95"
                            >
                              تجديد تلقائي لعام كامل 🔄
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSubscriptionQuickAction('upgrade')}
                              className="px-3.5 py-2 bg-amber-50/60 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30 text-[10px] font-black rounded-lg cursor-pointer transition-all hover:bg-amber-600 hover:text-white active:scale-95"
                            >
                              ترقية لـ Enterprise ⚡
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSubscriptionQuickAction('suspend')}
                              className={`px-3.5 py-2 text-[10px] font-black rounded-lg cursor-pointer border transition-all active:scale-95 ${
                                activeTenant?.status === 'suspended'
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 hover:bg-emerald-600 hover:text-white'
                                  : 'bg-rose-50/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100/50 dark:border-rose-900/30 hover:bg-rose-600 hover:text-white'
                              }`}
                            >
                              {activeTenant?.status === 'suspended' ? 'إيقاظ وفك تجميد المستأجر 🔓' : 'تجميد وتعليق رخصة المستأجر 🔒'}
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800 pt-3">
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-lg transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                          >
                            حفظ وحوكمة المحدّدات
                          </button>
                        </div>
                      </form>
                    </div>

                  </div>
                </div>

                {/* Modules Matrix Block */}
                <div className="dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 space-y-4 hover:shadow-md transition-all duration-300">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                      مصفوفة صلاحيات وتحكّم الوحدات لـ {activeSchool?.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      قم بتمكين أو حظر موديولات النظام الأساسية. ستنعكس هذه التغييرات على القائمة الجانبية وصلاحيات المستخدمين التابعين للمدرسة فوراً.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 bg-transparent dark:bg-slate-950/40 text-[10px] font-bold">
                          <th className="p-3 font-bold w-1/3">الوحدة البرمجية</th>
                          <th className="p-3 font-bold text-center">ترخيص الموديول (Active)</th>
                          <th className="p-3 font-bold text-center">الظهور بالسيستم (Visible)</th>
                          <th className="p-3 font-bold text-center">فئة حزمة سوبر (Premium)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                        {availableModules.map(m => {
                          const configKey = `${activeSchool?.id}_${m.key}`;
                          const config = schoolModules[configKey] || { active: null, visible: null, premium: null };
                          const MIcon = m.icon;

                          return (
                            <tr key={m.key} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-all duration-200 group">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                                    <MIcon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-xs">{m.label}</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-normal mt-0.5">{m.desc}</span>
                                  </div>
                                </div>
                              </td>
                              
                              <td className="p-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleModuleProperty(activeSchool.id, m.key, 'active')}
                                  className={`px-3.5 py-1.5 rounded-lg font-black text-[10px] cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                    config.active === true
                                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40'
                                      : config.active === false
                                      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40'
                                      : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40'
                                  }`}
                                >
                                  {config.active === true ? 'نشط ومصرح به' : config.active === false ? 'محظور من الاستخدام' : 'غير متحقق'}
                                </button>
                              </td>

                              <td className="p-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleModuleProperty(activeSchool.id, m.key, 'visible')}
                                  className={`px-3.5 py-1.5 rounded-lg font-black text-[10px] cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                    config.visible === true
                                      ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/40'
                                      : config.visible === false
                                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:border-slate-700'
                                      : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40'
                                  }`}
                                >
                                  {config.visible === true ? 'مرئي في القائمة' : config.visible === false ? 'مخفي بالكامل' : 'غير متحقق'}
                                </button>
                              </td>

                              <td className="p-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleModuleProperty(activeSchool.id, m.key, 'premium')}
                                  className={`px-3.5 py-1.5 rounded-lg font-black text-[10px] cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                    config.premium === true
                                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40'
                                      : config.premium === false
                                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:border-slate-700'
                                      : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40'
                                  }`}
                                >
                                  {config.premium === true ? 'وحدة VIP نشطة 👑' : config.premium === false ? 'ليست ضمن الباقة' : 'غير متحقق'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ================= TAB 4: BACKUPS ================= */}
            {activeTab === 'backups' && (
              <div className="dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 space-y-6 shadow-xs">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Database className="w-4.5 h-4.5 text-emerald-500" />
                      مركز النسخ الاحتياطي والتعافي السحابي (Disaster Recovery Engine)
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      قم بالتقاط نسخ احتياطية فورية لقواعد بيانات المدارس، وتحقق من سلامتها (Parity Check)، أو قم باستعادة نقطة استرجاع سابقة.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleCreateBackup}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 text-xs font-black transition-all flex items-center gap-2 shadow-amber-500/10 cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Database className="w-4 h-4 text-amber-200 animate-pulse" />
                    <span>توليد لقطة فورية كاملة لقاعدة البيانات 🔒</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-150 dark:border-slate-850 shadow-xs">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-150 dark:border-slate-850 bg-transparent dark:bg-slate-950 text-[10px] font-black uppercase tracking-wider">
                        <th className="p-4 text-center w-12">المعرف</th>
                        <th className="p-4">اسم المدرسة المستهدفة</th>
                        <th className="p-4">تاريخ ووقت النسخ</th>
                        <th className="p-4">حجم اللقطة</th>
                        <th className="p-4">النوع والمسؤول الكودى</th>
                        <th className="p-4 text-center">حالة الحفظ والـ Integrity</th>
                        <th className="p-4 text-left">إجراءات الاستعادة الفورية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                      {backupLogs.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-all duration-200 group">
                          <td className="p-4 text-center text-slate-500 dark:text-slate-400 font-mono font-bold bg-slate-50/40 dark:bg-slate-950/10">{b.id}</td>
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {b.schoolName}
                            </div>
                          </td>
                          <td className="p-4 font-mono text-slate-500 dark:text-slate-400 font-bold">{b.date}</td>
                          <td className="p-4 font-mono text-slate-500 dark:text-slate-400 font-extrabold">{b.size}</td>
                          <td className="p-4">
                            <span className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                              {b.type}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-black bg-amber-50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 px-2.5 py-1 rounded-lg text-[10px]">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                              غير متحقق من مخزن النسخ المركزي
                            </span>
                          </td>
                          <td className="p-4 text-left">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleVerifyIntegrity(b)}
                                className="px-3.5 py-1.5 dark:bg-slate-900 hover:bg-transparent dark:hover:bg-slate-950 dark:border-slate-800 rounded-lg text-amber-600 dark:text-amber-400 font-extrabold transition-all cursor-pointer text-[10px] shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                              >
                                التحقق من سلامتها (Checksum)
                              </button>
                              <button
                                onClick={() => handleRestoreBackup(b)}
                                className="px-3.5 py-1.5 bg-rose-50/60 dark:bg-rose-950/15 hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white border border-rose-100 dark:border-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400 font-black transition-all cursor-pointer text-[10px] hover:scale-[1.02] active:scale-[0.98]"
                              >
                                استعادة النسخة واجتثاث البيانات الحالية ⚠️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cron scheduler set-up */}
                <div className="bg-transparent dark:bg-slate-950 p-6 border border-slate-200/50 dark:border-slate-850 space-y-4">
                  <h4 className="text-xs font-black text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Clock className="w-4 h-4 text-amber-500" />
                    جدولة النسخ الاحتياطي التلقائي (Cron Scheduling Engine)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-xs">
                    <div className="md:col-span-5">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1.5">جدولة نسخ قواعد البيانات المؤتمتة:</span>
                      <select className="w-full dark:bg-slate-900 text-slate-900 dark:text-slate-200 rounded-lg border border-slate-200/80 dark:border-slate-850 p-2.5 text-xs font-black focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none">
                        <option>نسخ احتياطي تلقائي كل يوم (Daily 02:00 AM)</option>
                        <option>نسخ احتياطي تلقائي كل أسبوع (Weekly)</option>
                        <option>نسخ احتياطي تلقائي شهري (Monthly)</option>
                      </select>
                    </div>
                    <div className="md:col-span-4">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1.5">فترة ومعدل الاحتفاظ بالنسخ الاحتياطية (Retention Engine):</span>
                      <select className="w-full dark:bg-slate-900 text-slate-900 dark:text-slate-200 rounded-lg border border-slate-200/80 dark:border-slate-850 p-2.5 text-xs font-black focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none">
                        <option>آخر ٣٠ نسخة تاريخية</option>
                        <option>آخر ٦٠ نسخة تاريخية</option>
                        <option>آخر ٩٠ نسخة تاريخية</option>
                      </select>
                    </div>
                    <div className="md:col-span-3 flex items-end">
                      <button
                        onClick={() => {
                          triggerNotification('موصل جدولة النسخ المركزي غير متاح؛ لم تُحفظ أو تُفعّل أي جدولة.', 'warning');
                        }}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs py-2.5 rounded-lg transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                      >
                        تطبيق الجدولة وتحديث الـ Crontab
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 5: SUPPORT IMPERSONATION LOGIN ================= */}
            {activeTab === 'support' && (
              <div className="dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 space-y-6 hover:shadow-md transition-all duration-300">
                <div className="border-b border-slate-150 dark:border-slate-800 pb-4.5 flex items-start gap-4">
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30 shadow-xs">
                    <ShieldAlert className="w-6 h-6 shrink-0" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      مركز الولوج الإداري المؤقت والتدقيق المباشر (Support Impersonation Hub)
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                      هذا المسار يجهّز طلب دعم فني مركزي. لا تُفتح جلسة انتحال أو وصول مباشر من المتصفح؛ يلزم إصدار جلسة قصيرة العمر من خدمة الهوية المركزية مع تسجيل التدقيق قبل التنفيذ.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Impersonation Form */}
                  <form onSubmit={handleStartImpersonate} className="md:col-span-7 bg-transparent dark:bg-slate-950 p-6 border border-slate-200/60 dark:border-slate-850 space-y-5">
                    <h4 className="text-xs font-black text-slate-950 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Key className="w-4 h-4 text-rose-500 animate-pulse" />
                      تفويض وبدء جلسة ولوج دعم فني موثقة
                    </h4>

                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1.5">المدرسة المستهدفة للولوج الفني المباشر:</span>
                        <div className="dark:bg-slate-900 p-3.5 border border-slate-200/80 dark:border-slate-800 font-extrabold text-amber-600 dark:text-amber-400 text-xs shadow-2xs flex items-center justify-between">
                          <span>{activeSchool?.name}</span>
                          <span className="font-mono bg-amber-50 dark:bg-amber-950/40 border border-amber-100/30 dark:border-amber-900/40 px-2 py-0.5 rounded text-[10px]">
                            {activeSchool?.subdomain}.erpcloud.com
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1.5">اسم مهندس الدعم الفني المسؤول (Engineer Identity):</label>
                        <input
                          required
                          type="text"
                          value={engineerName}
                          onChange={(e) => setEngineerName(e.target.value)}
                          placeholder="مثال: سليمان غازي"
                          className="w-full dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 p-3 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none font-bold placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1.5">السبب التفصيلي والمصادقة الأمنية لعملية الدخول:</label>
                        <textarea
                          required
                          rows={3}
                          value={supportReason}
                          onChange={(e) => setSupportReason(e.target.value)}
                          placeholder="الرجاء توضيح رقم تذكرة العميل، أو الإجراء المطلوب بدقة متناهية..."
                          className="w-full dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 p-3 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none leading-relaxed placeholder-slate-400"
                        />
                      </div>

                      <div className="bg-rose-50/60 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900/30 p-3.5 text-[10px] text-rose-600 dark:text-rose-400 leading-relaxed space-y-1">
                        <p className="font-black flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          تنبيه الامتثال التنظيمي (Compliance Policy):
                        </p>
                        <p>
                          كافة الإجراءات والتحركات المنفذة (تغيير مالي، تعديل بيانات، شطب فواتير) يتم رصدها وتدقيقها في سجلات البنك المركزي وبموجب الترخيص السيادي الممنوح لك.
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isImpersonationSubmitting || !supportReason.trim()}
                      className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 disabled:opacity-40 text-white text-xs font-black py-3.5 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-rose-500/10 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <Play className="w-4 h-4 text-rose-200" />
                        <span>{isImpersonationSubmitting ? 'جاري إرسال طلب جلسة الدعم...' : `طلب جلسة دعم مركزية لـ ${activeSchool?.name || 'المدرسة المحددة'} 🚀`}</span>
                    </button>
                  </form>

                  {/* Impersonation logs */}
                  <div className="md:col-span-5 bg-transparent dark:bg-slate-950 p-6 border border-slate-200/60 dark:border-slate-850 flex flex-col justify-between shadow-inner">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-950 dark:text-white flex items-center gap-1.5 border-b border-slate-150 dark:border-slate-800 pb-3">
                        <FileText className="w-4 h-4 text-amber-500" />
                        سجلات مراجعة وتراخيص الهوية الفيدرالية
                      </h4>

                      <div className="space-y-3 max-h-[290px] overflow-y-auto">
                        <div className="p-4 dark:bg-slate-900 border border-amber-200/50 dark:border-amber-900/30 text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                          لا توجد جلسات دعم موثقة للعرض. لن تُنشأ جلسة دخول حتى يتوفر رمز مركزي قصير العمر وسجل تدقيق غير قابل للتلاعب.
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed pt-3.5 border-t border-slate-150 dark:border-slate-800 mt-4 text-right font-semibold">
                      خدمة الولوج الفني مغلقة آمنًا حاليًا؛ لا تُمنح صلاحيات مدرسة من حالة محلية أو من المتصفح.
                    </div>
                  </div>

                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
