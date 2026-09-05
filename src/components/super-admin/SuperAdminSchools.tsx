import { Archive, Ban, Calendar, CheckCircle, Copy, Edit2, ExternalLink, FileSpreadsheet, Globe, HardDrive, Key, Layers, Lock as LockIcon, Plus, RefreshCw, RotateCcw, Search, ShieldAlert, ShieldCheck, Sliders, Sparkles, Trash2, Users, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getTrustedSchoolUrl, openTrustedSchoolPortal } from '../../utils/EnterpriseDomainUtils';
import { authenticatedRequest } from '../../utils/authenticatedRequest';
import { toDisplayPlan, updateCanonicalTenantSubscription } from '../../utils/centralTenantSubscription';
import ImpersonationModal from './ImpersonationModal';

interface SuperAdminSchoolsProps {
  schools: any[];
  tenants?: any[];
  setTenants?: React.Dispatch<React.SetStateAction<any[]>>;
  setSchools: React.Dispatch<React.SetStateAction<any[]>>;
  branches: any[];
  setBranches: React.Dispatch<React.SetStateAction<any[]>>;
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
  onSetSuccessProvision?: (details: any) => void;
  onOpenSchoolLogin?: (school: any) => void;
  onImpersonateSchool?: (school: any, reason: string) => void;
  currentRole?: string;
}

export default function SuperAdminSchools({
  schools = [],
  tenants = [],
  setTenants,
  setSchools,
  branches = [],
  setBranches,
  logAction,
  triggerNotification,
  onOpenSchoolLogin,
  onImpersonateSchool,
  currentRole = 'SuperAdmin'
}: SuperAdminSchoolsProps) {

  // Local state for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // all, active, suspended, trial, expired, archived

  // Local state for modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLimitsModal, setShowLimitsModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [impersonateTarget, setImpersonateTarget] = useState<any | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [directoryStatus, setDirectoryStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Active object being edited/viewed
  const [currentSchool, setCurrentSchool] = useState<any | null>(null);

  // New School Wizard state
  const [newSchool, setNewSchool] = useState({
    targetTenantId: '',
    name: '',
    schoolShortName: '',
    schoolCode: '',
    type: 'private',
    city: 'الرياض',
    address: '',
    phone: '',
    email: '',
    subdomain: '',
    managerName: '',
    adminEmail: '',
    password: '',
  });

  useEffect(() => {
    if (!newSchool.targetTenantId && tenants[0]?.id) {
      setNewSchool((current) => ({ ...current, targetTenantId: tenants[0].id }));
    }
  }, [newSchool.targetTenantId, tenants]);

  // Clone Wizard state
  const [cloneWizard, setCloneWizard] = useState({
    sourceSchoolId: '',
    destSchoolId: '',
    copyAcademic: true,
    copyRbac: true,
    copyFinance: false,
    isProcessing: false,
    progress: 0,
    logs: [] as string[]
  });

  // Subscription Limits Wizard state
  const [limitEditor, setLimitEditor] = useState({
    plan: '',
    storageLimit: null as number | null,
    userLimit: null as number | null,
    durationMonths: 12,
    status: 'active'
  });

  // Soft delete confirmation security state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // -------------------------------------------------------------
  // ACTIONS HANDLERS
  // -------------------------------------------------------------

  const mutateCentralSchool = async (schoolId: string, body: Record<string, unknown>) => {
    const response = await authenticatedRequest(`/api/admin/central/schools/${encodeURIComponent(schoolId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success || !payload?.school) {
      throw new Error(payload?.message || 'CENTRAL_SCHOOL_UPDATE_FAILED');
    }
    return payload.school;
  };

  const getTenantForSchool = (school: any) => {
    const tenantId = school?.tenantId || school?.tenant_id;
    return tenants.find((tenant) => tenant.id === tenantId) || null;
  };

  const getEffectiveSchoolStatus = (school: any) => school?.tenantStatus === 'suspended' ? 'suspended' : school?.status;

  const selectedTenant = tenants.find((tenant) => tenant.id === newSchool.targetTenantId) || null;

  useEffect(() => {
    let mounted = true;
    const loadCentralSchools = async () => {
      setDirectoryStatus('loading');
      try {
        const [response, branchesResponse] = await Promise.all([
          authenticatedRequest('/api/admin/central/schools'),
          authenticatedRequest('/api/admin/central/branches'),
        ]);
        const payload = await response.json().catch(() => ({}));
        const branchesPayload = await branchesResponse.json().catch(() => ({}));
        if (!response.ok || !payload?.success || !Array.isArray(payload.schools)) {
          throw new Error(payload?.message || 'CENTRAL_SCHOOL_DIRECTORY_UNAVAILABLE');
        }
        if (!branchesResponse.ok || !branchesPayload?.success || !Array.isArray(branchesPayload.branches)) {
          throw new Error(branchesPayload?.message || 'CENTRAL_BRANCH_DIRECTORY_UNAVAILABLE');
        }
        if (!mounted) return;
        const canonicalSchools = payload.schools.map((school: any) => ({
          ...(school.central_metadata && typeof school.central_metadata === 'object' ? school.central_metadata : {}),
          id: school.id,
          tenantId: school.tenant_id,
          name: school.display_name,
          schoolShortName: school.display_name,
          schoolCode: school.school_code,
          status: school.status,
          tenantStatus: school.tenant_status || undefined,
          archived: school.status === 'archived',
          usersCount: Number(school.users_count || 0),
          studentCount: Number(school.students_count || 0),
          plan: school.subscription?.plan_code ? toDisplayPlan(school.subscription.plan_code) : undefined,
          subscriptionStatus: school.subscription?.status || undefined,
          subscriptionStart: school.subscription?.starts_at || undefined,
          subscriptionEnd: school.subscription?.ends_at || undefined,
          userLimit: school.subscription?.seat_limit ? Number(school.subscription.seat_limit) : undefined,
          timezone: school.timezone,
          locale: school.locale,
          schoolUrl: getTrustedSchoolUrl({ id: school.id }),
          connectedDb: 'canonical-postgres',
        }));
        const canonicalBranches = branchesPayload.branches.map((branch: any) => ({
          ...branch,
          id: branch.id,
          schoolId: branch.school_id,
          schoolName: branch.school_name,
          name: branch.name,
          branchCode: branch.branch_code,
          city: branch.city || branch.address?.city || '',
          phone: branch.phone || branch.address?.phone || '',
          address: branch.address?.address || '',
          status: branch.status === 'closed' ? 'suspended' : branch.status,
          isMain: Boolean(branch.is_main),
          studentsCount: Number(branch.students_count || 0),
          employeesCount: Number(branch.users_count || 0),
        }));
        setSchools(canonicalSchools);
        setBranches(canonicalBranches);
        setDirectoryStatus('ready');
      } catch (error) {
        if (mounted) {
          setDirectoryStatus('error');
          triggerNotification(error instanceof Error ? error.message : 'تعذر تحميل دليل المدارس المركزي.', 'danger');
        }
      }
    };
    void loadCentralSchools();
    return () => { mounted = false; };
  }, []);
  
  // Handle Add School (Provision Tenant)
  const handleProvisionSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check parameters
    if (!newSchool.name.trim()) {
      triggerNotification('يرجى إدخال اسم المدرسة لبدء التهيئة المركزية.', 'warning');
      return;
    }

    if (newSchool.schoolCode && schools.some(s => String(s.schoolCode || '').toUpperCase() === newSchool.schoolCode.toUpperCase())) {
      triggerNotification('رمز المدرسة مستخدم مسبقاً داخل الدليل المركزي.', 'danger');
      return;
    }

    setIsProvisioning(true);
    try {
      const response = await authenticatedRequest('/api/admin/central/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetTenantId: newSchool.targetTenantId || tenants[0]?.id,
          name: newSchool.name,
          schoolCode: newSchool.schoolCode || undefined,
          shortName: newSchool.schoolShortName,
          subdomain: newSchool.subdomain,
          city: newSchool.city,
          address: newSchool.address,
          phone: newSchool.phone,
          email: newSchool.email,
          managerName: newSchool.managerName,
          managerEmail: newSchool.adminEmail,
          timezone: 'Africa/Khartoum',
          locale: 'ar',
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !payload?.school || !payload?.branch) {
        throw new Error(payload?.message || 'CENTRAL_SCHOOL_PROVISIONING_FAILED');
      }

      const canonicalSchool = payload.school;
      const canonicalBranch = payload.branch;
      const createdSchool = {
        ...(canonicalSchool.central_metadata && typeof canonicalSchool.central_metadata === 'object' ? canonicalSchool.central_metadata : {}),
        ...canonicalSchool,
        id: canonicalSchool.id,
        name: canonicalSchool.display_name,
        schoolShortName: canonicalSchool.display_name,
        schoolCode: canonicalSchool.school_code,
        status: canonicalSchool.status,
        tenantStatus: selectedTenant?.status,
        archived: false,
        usersCount: 0,
        studentCount: 0,
        connectedDb: 'canonical-postgres',
        schoolUrl: getTrustedSchoolUrl({ id: canonicalSchool.id }),
      };
      const createdBranch = {
        ...canonicalBranch,
        id: canonicalBranch.id,
        schoolId: canonicalBranch.school_id,
        name: canonicalBranch.name,
        status: canonicalBranch.status,
        isMain: true,
      };
      setSchools(prev => [...prev, createdSchool]);
      setBranches(prev => [...prev, createdBranch]);
      setTenants?.((current) => current.map((tenant) => tenant.id === newSchool.targetTenantId
        ? { ...tenant, schoolsCount: Number(tenant.schoolsCount || 0) + 1, branchesCount: Number(tenant.branchesCount || 0) + 1 }
        : tenant));
      logAction('CREATE_SCHOOL', `تأسيس مدرسة جديدة من المصدر المركزي: ${canonicalSchool.display_name}`, 'الإدارة المركزية');
      triggerNotification('تم إنشاء المدرسة والفرع في قاعدة البيانات المركزية ✅', 'success');
      setShowAddModal(false);
      setNewSchool({
        targetTenantId: tenants[0]?.id || '', name: '', schoolShortName: '', schoolCode: '', type: 'private', city: 'الرياض', address: '', phone: '', email: '',
        subdomain: '', managerName: '', adminEmail: '', password: ''
      });
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر إنشاء المدرسة مركزياً؛ لم يتم تعديل البيانات.', 'danger');
    } finally {
      setIsProvisioning(false);
    }
    return;

  };

  // Edit School
  const handleSaveEditSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSchool) return;

    try {
      const school = await mutateCentralSchool(currentSchool.id, {
        operation: 'update', name: currentSchool.name, schoolCode: currentSchool.schoolCode,
        profile: {
          shortName: currentSchool.schoolShortName,
          city: currentSchool.city,
          address: currentSchool.address,
          phone: currentSchool.phone,
          email: currentSchool.email,
          managerName: currentSchool.managerName,
          managerEmail: currentSchool.adminEmail,
        },
      });
      const profile = school.central_metadata && typeof school.central_metadata === 'object' ? school.central_metadata : {};
      setSchools(prev => prev.map(item => item.id === school.id ? { ...item, ...profile, ...school, name: school.display_name, schoolCode: school.school_code, schoolShortName: profile.shortName || school.display_name } : item));
      logAction('EDIT_SCHOOL', `تحديث بيانات المدرسة من المصدر المركزي: ${school.display_name}`, 'الإدارة المركزية');
      triggerNotification('تم تحديث بيانات المدرسة في قاعدة البيانات المركزية ✅', 'success');
      setShowEditModal(false);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر تحديث المدرسة؛ لم يتم تعديل البيانات.', 'danger');
    }
  };

  // Toggle school frozen/active status
  const handleToggleFreezeSchool = async (school: any) => {
    const tenant = getTenantForSchool(school);
    if (tenant?.status === 'suspended') {
      triggerNotification('المستأجر موقوف مركزيًا؛ فعّله من إدارة المستأجرين أو الاشتراكات قبل تغيير حالة المدرسة.', 'warning');
      return;
    }
    const isFrozen = getEffectiveSchoolStatus(school) === 'suspended';
    const newStatus = isFrozen ? 'active' : 'suspended';
    try {
      const canonical = await mutateCentralSchool(school.id, { operation: 'status', status: newStatus });
      setSchools(prev => prev.map(item => item.id === canonical.id ? { ...item, status: canonical.status } : item));
      logAction(isFrozen ? 'UNFREEZE_SCHOOL' : 'FREEZE_SCHOOL', `${isFrozen ? 'إلغاء تفعيل' : 'تعليق'} المدرسة مركزياً: ${school.name}`, 'الحماية والامتثال');
      triggerNotification(isFrozen ? `تم تفعيل مدرسة ${school.name} مركزياً` : `تم تعليق مدرسة ${school.name} مركزياً`, isFrozen ? 'success' : 'warning');
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر تغيير حالة المدرسة؛ لم يتم تعديل البيانات.', 'danger');
    }
  };

  // Archive School
  const handleToggleArchiveSchool = async (school: any) => {
    const isArchived = !!school.archived;
    if (isArchived) {
      try {
        const canonical = await mutateCentralSchool(school.id, { operation: 'restore' });
        setSchools(prev => prev.map(item => item.id === canonical.id ? { ...item, status: canonical.status, archived: false } : item));
        setBranches(prev => prev.map(branch => branch.schoolId === school.id && branch.status === 'archived'
          ? { ...branch, status: 'suspended', archived: false }
          : branch));
        setTenants?.((current) => current.map((tenant) => tenant.id === school.tenantId
          ? { ...tenant, schoolsCount: Number(tenant.schoolsCount || 0) + 1, branchesCount: Number(tenant.branchesCount || 0) + branches.filter((branch) => branch.schoolId === school.id && branch.status === 'archived').length }
          : tenant));
        logAction('RESTORE_SCHOOL', `استعادة المدرسة كمعلقة للمراجعة المركزية: ${school.name}`, 'شؤون التخزين');
        triggerNotification(`تمت استعادة ${school.name} كمعلقة؛ فعّل المدرسة والفروع والهويات بعد المراجعة.`, 'warning');
      } catch (error) {
        triggerNotification(error instanceof Error ? error.message : 'تعذر استعادة المدرسة مركزياً؛ لم يتم تعديل البيانات.', 'danger');
      }
      return;
    }
    try {
      const canonical = await mutateCentralSchool(school.id, { operation: 'archive' });
      setSchools(prev => prev.map(item => item.id === canonical.id ? { ...item, status: canonical.status, archived: true } : item));
      setBranches(prev => prev.map(branch => branch.schoolId === school.id ? { ...branch, status: 'archived', archived: true } : branch));
      setTenants?.((current) => current.map((tenant) => tenant.id === school.tenantId
        ? { ...tenant, schoolsCount: Math.max(0, Number(tenant.schoolsCount || 0) - 1), branchesCount: Math.max(0, Number(tenant.branchesCount || 0) - branches.filter((branch) => branch.schoolId === school.id).length) }
        : tenant));
      logAction('ARCHIVE_SCHOOL', `أرشفة المدرسة مركزياً: ${school.name}`, 'شؤون التخزين');
      triggerNotification(`تمت أرشفة ${school.name} في قاعدة البيانات المركزية`, 'info');
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر أرشفة المدرسة؛ لم يتم تعديل البيانات.', 'danger');
    }
  };

  // Permanently Terminate School services (sets status to terminated)
  const handleTerminateSchool = async (school: any) => {
    if (confirm(`⚠️ تحذير أمني: هل أنت متأكد من إنهاء اشتراك مدرسة ${school.name} نهائياً وإغلاق بوابة الدخول؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      try {
        const canonical = await mutateCentralSchool(school.id, { operation: 'archive' });
        setSchools(prev => prev.map(item => item.id === canonical.id ? { ...item, status: canonical.status, archived: true } : item));
        logAction('TERMINATE_SCHOOL', `أرشفة خدمات مدرسة مركزياً: ${school.name}`, 'الرقابة القضائية');
        triggerNotification(`تمت أرشفة خدمات مدرسة ${school.name} مركزياً`, 'danger');
      } catch (error) {
        triggerNotification(error instanceof Error ? error.message : 'تعذر إنهاء المدرسة؛ لم يتم تعديل البيانات.', 'danger');
      }
    }
  };

  // Safe soft delete with double entry check
  const handleSafeDeleteSchool = async () => {
    if (!currentSchool) return;

    if (deleteConfirmText !== currentSchool.name) {
      triggerNotification('الاسم المدخل غير متطابق مع اسم المدرسة المراد حذفها', 'danger');
      return;
    }

    try {
      await mutateCentralSchool(currentSchool.id, { operation: 'archive' });
        setSchools(prev => prev.filter(s => s.id !== currentSchool.id));
        setBranches(prev => prev.filter(b => b.schoolId !== currentSchool.id));
        setTenants?.((current) => current.map((tenant) => tenant.id === currentSchool.tenantId
          ? { ...tenant, schoolsCount: Math.max(0, Number(tenant.schoolsCount || 0) - 1), branchesCount: Math.max(0, Number(tenant.branchesCount || 0) - branches.filter((branch) => branch.schoolId === currentSchool.id).length) }
          : tenant));
      logAction('SOFT_DELETE_SCHOOL', `أرشفة آمنة للمستأجر في المصدر المركزي: ${currentSchool.name}`, 'الحوكمة');
      triggerNotification('تمت أرشفة المدرسة وفروعها من المصدر المركزي ✅', 'success');
      setShowDeleteModal(false);
      setDeleteConfirmText('');
      setCurrentSchool(null);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر الأرشفة؛ لم يتم تعديل البيانات.', 'danger');
    }
  };

  // Update subscription limits & packages
  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSchool) return;

    const currentTenant = getTenantForSchool(currentSchool);
    const currentStorageLimit = parseInt(String(currentSchool.storageLimit || ''), 10);
    if (limitEditor.storageLimit !== null && Number.isFinite(currentStorageLimit) && currentStorageLimit !== limitEditor.storageLimit) {
      triggerNotification('تعديل السعة التخزينية يحتاج موصل تخزين مركزي موثق؛ لم يتم حفظ أي جزء من التعديل.', 'warning');
      return;
    }
    if (!currentTenant?.subscription) {
      triggerNotification('لا يوجد اشتراك كانونى مرتبط بهذه المدرسة؛ أنشئ الاشتراك من دليل المستأجرين أولاً.', 'warning');
      return;
    }
    if (!limitEditor.plan.trim()) {
      triggerNotification('لم يتم التحقق من باقة الاشتراك الكانونية؛ لم يتم تعديل البيانات.', 'warning');
      return;
    }
    if (!Number.isSafeInteger(limitEditor.userLimit) || limitEditor.userLimit < 1) {
      triggerNotification('حد المستخدمين يجب أن يكون رقماً صحيحاً موجباً.', 'warning');
      return;
    }

    const currentStart = new Date(currentTenant.subscription.startsAt || currentTenant.subscription.starts_at);
    if (Number.isNaN(currentStart.getTime())) {
      triggerNotification('تاريخ بداية الاشتراك الكانوني غير صالح؛ لم يتم تعديل البيانات.', 'danger');
      return;
    }
    if (!Number.isSafeInteger(limitEditor.durationMonths) || limitEditor.durationMonths < 1) {
      triggerNotification('فترة التمديد يجب أن تكون مدة موجبة ومتحققة من سجل الاشتراك الكانوني.', 'warning');
      return;
    }
    if (!['active', 'suspended'].includes(limitEditor.status)) {
      triggerNotification('لا يمكن تعديل اشتراك مستأجر في حالة غير قابلة للإدارة من هذه الشاشة.', 'warning');
      return;
    }
    const newEnd = new Date(currentStart.setMonth(currentStart.getMonth() + limitEditor.durationMonths)).toISOString().split('T')[0];
    try {
      const canonicalTenant = await updateCanonicalTenantSubscription(currentTenant, {
        planCode: limitEditor.plan,
        status: 'active',
        seatLimit: limitEditor.userLimit,
        endsAt: newEnd,
        tenantStatus: limitEditor.status as 'active' | 'suspended',
      });
      setTenants?.((current) => current.map((tenant) => tenant.id === canonicalTenant.id ? { ...tenant, ...canonicalTenant } : tenant));
      setSchools((current) => current.map((school) => {
        const schoolTenantId = school.tenantId || school.tenant_id;
        return schoolTenantId === canonicalTenant.id && canonicalTenant.subscription
          ? { ...school, plan: toDisplayPlan(canonicalTenant.planCode), subscriptionStatus: canonicalTenant.subscription.status, subscriptionStart: canonicalTenant.subscription.startsAt, subscriptionEnd: canonicalTenant.subscription.endsAt, userLimit: canonicalTenant.subscription.seatLimit }
          : school;
      }));
      setCurrentSchool((current) => current?.id === currentSchool.id && canonicalTenant.subscription
        ? { ...current, plan: toDisplayPlan(canonicalTenant.planCode), subscriptionStatus: canonicalTenant.subscription.status, subscriptionStart: canonicalTenant.subscription.startsAt, subscriptionEnd: canonicalTenant.subscription.endsAt, userLimit: canonicalTenant.subscription.seatLimit }
        : current);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر حفظ حدود الاشتراك في الإدارة المركزية.', 'danger');
      return;
    }

    logAction(
      'UPDATE_LIMITS', 
      `تعديل رخص واشتراك ${currentSchool.name}: الباقة [${limitEditor.plan}]، سعة التخزين [غير متحقق دون موصل]، مستخدمين [${limitEditor.userLimit}]`,
      'الاشتراكات والتراخيص'
    );
    triggerNotification('تم تعديل الباقة وحد المقاعد وحالة المستأجر في المصدر المركزي. السعة التخزينية بقيت كما هي لأنها تحتاج موصل تخزين موثق.', 'success');
    setShowLimitsModal(false);
  };

  // Copying configuration requires a dedicated, audited central transaction.
  const handleRunCloneSettings = async () => {
    if (!cloneWizard.sourceSchoolId || !cloneWizard.destSchoolId) {
      triggerNotification('يرجى اختيار مدرسة المصدر ومدرسة الهدف للنسخ', 'warning');
      return;
    }
    if (cloneWizard.sourceSchoolId === cloneWizard.destSchoolId) {
      triggerNotification('لا يمكن نسخ الإعدادات لنفس المدرسة', 'warning');
      return;
    }

    const sourceSchool = schools.find((school) => school.id === cloneWizard.sourceSchoolId);
    const destinationSchool = schools.find((school) => school.id === cloneWizard.destSchoolId);
    if (!sourceSchool || !destinationSchool) {
      triggerNotification('تعذر التحقق من مدرسة المصدر أو الهدف؛ لم يتم تعديل أي مدرسة.', 'danger');
      return;
    }
    const sourceFeatures = sourceSchool.features && typeof sourceSchool.features === 'object' ? sourceSchool.features : {};
    if (!Object.keys(sourceFeatures).length && !sourceSchool.templateId) {
      triggerNotification('مدرسة المصدر لا تحتوي قالبًا أو ميزات موثقة قابلة للنقل.', 'warning');
      return;
    }
    setCloneWizard(prev => ({ ...prev, isProcessing: true, progress: 20, logs: ['تم التحقق من المصدر والهدف.'] }));
    try {
      const response = await authenticatedRequest('/api/admin/central/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'school',
          schoolId: destinationSchool.id,
          templateId: sourceSchool.templateId || undefined,
          featureOverrides: Object.keys(sourceFeatures).length ? sourceFeatures : undefined,
          channel: 'pilot',
          title: `نقل إعدادات موثق من ${sourceSchool.name}`,
          notes: `نسخ إعدادات القالب والميزات فقط. الخيارات الأكاديمية والمالية لا تنقل بيانات تشغيلية بين المدارس. طلبه المالك من شاشة المدارس.`,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر نقل إعدادات المدرسة.');
      const canonical = Array.isArray(payload.schools) ? payload.schools[0] : null;
      if (canonical) {
        const metadata = canonical.central_metadata && typeof canonical.central_metadata === 'object' ? canonical.central_metadata : {};
        setSchools((current) => current.map((school) => school.id === canonical.id ? {
          ...school,
          ...metadata,
          name: canonical.display_name,
          schoolCode: canonical.school_code,
          status: canonical.status,
          features: metadata.features || {},
        } : school));
      }
      setCloneWizard(prev => ({ ...prev, isProcessing: false, progress: 100, logs: [...prev.logs, 'تم اعتماد الإصدار الموجّه للمدرسة الهدف.'] }));
      logAction('PUBLISH_SCHOOL_CONFIGURATION_RELEASE', `نقل قالب وميزات موثقة من ${sourceSchool.name} إلى ${destinationSchool.name}`, 'مركز المالك والإصدارات');
      triggerNotification(`تم نقل الإعدادات الموثقة إلى ${destinationSchool.name} فقط. لم تُنقل أي بيانات تشغيلية أو مالية.`, 'success');
      setShowCloneModal(false);
    } catch (error) {
      setCloneWizard(prev => ({ ...prev, isProcessing: false, progress: 0, logs: [...prev.logs, 'فشل النقل ولم يتم تغيير الهدف.'] }));
      triggerNotification(error instanceof Error ? error.message : 'تعذر نقل الإعدادات؛ لم تتغير المدرسة الهدف.', 'danger');
    }
  };

  // Reset clone wizard
  const resetCloneWizard = () => {
    setCloneWizard({
      sourceSchoolId: '',
      destSchoolId: '',
      copyAcademic: true,
      copyRbac: true,
      copyFinance: false,
      isProcessing: false,
      progress: 0,
      logs: []
    });
  };

  // Open limit editor with prefilled school info
  const openLimitEditor = (school: any) => {
    setCurrentSchool(school);
    const tenant = getTenantForSchool(school);
    const startsAt = new Date(tenant?.subscription?.startsAt || tenant?.subscription?.starts_at || '');
    const endsAt = new Date(tenant?.subscription?.endsAt || tenant?.subscription?.ends_at || '');
    const durationMonths = Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())
      ? null
      : Math.max(0, (endsAt.getUTCFullYear() - startsAt.getUTCFullYear()) * 12 + (endsAt.getUTCMonth() - startsAt.getUTCMonth()));
    const parsedStorage = parseInt(String(school.storageLimit || ''), 10);
    const rawStorage = Number.isFinite(parsedStorage) ? parsedStorage : null;
    const parsedUsers = parseInt(String(school.userLimit || ''), 10);
    const rawUsers = Number.isFinite(parsedUsers) ? parsedUsers : null;
    
    setLimitEditor({
      plan: toDisplayPlan(tenant?.subscription?.planCode || tenant?.subscription?.plan_code || school.plan),
      storageLimit: rawStorage,
      userLimit: rawUsers,
      durationMonths,
      status: tenant?.status === 'suspended' ? 'suspended' : tenant?.status === 'active' ? 'active' : ''
    });
    setShowLimitsModal(true);
  };

  // -------------------------------------------------------------
  // FILTERS LOGIC
  // -------------------------------------------------------------
  const filteredSchools = schools.filter(school => {
    // Federal search by school name, short name, code, domain, or subdomain
    const matchesSearch = 
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.schoolShortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.schoolCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (school.domain && school.domain.toLowerCase().includes(searchTerm.toLowerCase())) ||
      school.subdomain.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by city
    const matchesCity = selectedCity === 'all' || school.city === selectedCity;

    // Filter by package
    const matchesPlan = selectedPlan === 'all' || school.plan === selectedPlan;

    // Filter by status
    const matchesStatus = () => {
      if (selectedStatus === 'all') return !school.archived; // Default: show active non-archived
      if (selectedStatus === 'archived') return !!school.archived; // Archived
      return getEffectiveSchoolStatus(school) === selectedStatus && !school.archived;
    };

    return matchesSearch && matchesCity && matchesPlan && matchesStatus();
  });

  return (
    <div className="space-y-5 text-right animate-in fade-in duration-200" dir="rtl">
      
      {/* Search and Action Bar */}
      <div className="rounded-3xl border-2 border-[#d4af37]/30 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] p-4 shadow-md flex flex-col md:flex-row gap-3 justify-between items-center">
        
        {/* Actions button */}
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-initial bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
          >
            <Plus className="w-4 h-4" />
            <span>تأسيس مستأجر مدرسة جديدة</span>
          </button>

          <span className={`hidden lg:inline-flex items-center gap-1.5 px-3 text-[10px] font-bold border ${directoryStatus === 'loading' ? 'text-amber-300 border-amber-900 bg-amber-950/30' : directoryStatus === 'ready' ? 'text-emerald-300 border-emerald-900 bg-emerald-950/30' : 'text-rose-300 border-rose-900 bg-rose-950/30'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${directoryStatus === 'loading' ? 'bg-amber-400 animate-pulse' : directoryStatus === 'ready' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            {directoryStatus === 'loading' ? 'جاري تحميل الدليل المركزي...' : directoryStatus === 'ready' ? 'الدليل المركزي متصل' : 'تعذر اتصال الدليل المركزي'}
          </span>

          <button
            onClick={() => setShowCloneModal(true)}
            className="rounded-2xl bg-[#2a1a0e] border border-[#d4af37]/30 hover:border-[#f7d174] text-amber-200 hover:text-white px-3.5 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
          >
            <Copy className="w-4 h-4" />
            <span>نسخ وتهيئة الإعدادات</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full md:max-w-md bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-2xl px-10 py-2 shadow-sm transition-all duration-300">
          <Search className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
          <input
            type="text"
            placeholder="بحث في مدارس المستأجرين (الاسم، الرمز، النطاق الفرعي...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-0 focus:border-amber-500 focus:ring-0 pr-0 pl-4 py-1.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none transition-all"
          />
        </div>

      </div>

      {/* Advanced Filter Pills Row */}
      <div className="flex flex-wrap gap-4 items-center rounded-2xl bg-white/60 p-4 border border-[#d4af37]/20 text-xs shadow-sm">
        <span className="text-slate-400 font-bold">فلترة متقدمة:</span>
        
        {/* City Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">المدينة:</span>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1 focus:outline-none focus:border-amber-500"
          >
            <option value="all">الكل</option>
            <option value="الرياض">الرياض</option>
            <option value="جدة">جدة</option>
            <option value="الدمام">الدمام</option>
          </select>
        </div>

        {/* Plan Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">الباقة:</span>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1 focus:outline-none focus:border-amber-500"
          >
            <option value="all">الكل</option>
            <option value="Basic">أساسية (Basic)</option>
            <option value="Business">متقدمة (Business)</option>
            <option value="Enterprise">المؤسسات (Enterprise)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">الحالة العامة:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1 focus:outline-none focus:border-amber-500"
          >
            <option value="all">كل المدارس غير المؤرشفة</option>
            <option value="active">نشطة (Active)</option>
            <option value="suspended">موقوفة/مجمدة</option>
            <option value="trial">تجريبية</option>
            <option value="terminated">منتهية الخدمة</option>
            <option value="archived">المؤرشفة فقط 📥</option>
          </select>
        </div>

        {/* Results Counter */}
        <div className="mr-auto text-[10px] bg-[#2a1a0e] border border-[#d4af37]/30 rounded-full px-2.5 py-1 text-amber-100 font-mono">
          تم العثور على: {filteredSchools.length} مدرسة
        </div>

      </div>

      {/* Main Grid / Directory Table */}
      <div className="bg-[#fffdf8] border-2 border-[#d4af37]/30 rounded-3xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#2a1d13] text-amber-100 font-extrabold uppercase border-b border-[#d4af37]/20">
              <tr>
                <th className="p-4 text-center w-8">#</th>
                <th className="p-4 text-center w-14">الشعار</th>
                <th className="p-4">المنشأة التعليمية / المستأجر</th>
                <th className="p-4">الرمز والمدينة</th>
                <th className="p-4">النطاق السحابي المعزول</th>
                <th className="p-4">الباقة والحدود</th>
                <th className="p-4">حالة التشغيل</th>
                <th className="p-4 text-center w-56">العمليات والتحكم المركزي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 text-slate-700 font-sans">
              {filteredSchools.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <Globe className="w-12 h-12 text-slate-700 mx-auto mb-3 animate-pulse" />
                    <p className="font-bold text-slate-400">لا يوجد مدارس مستأجرة مطابقة لخيارات الفلترة الحالية</p>
                    <p className="text-[10px] text-slate-600 mt-1">تأكد من إدخال اسم صحيح أو مراجعة معايير التصفية والمدينة والولاية والوضع المحلى.</p>
                  </td>
                </tr>
              ) : (
                filteredSchools.map((school, idx) => (
                  <tr key={school.id} className="hover:bg-[#fbf8f0] transition-colors group">
                    
                    {/* Index */}
                    <td className="p-4 text-center text-slate-500 font-mono font-bold w-8">{idx + 1}</td>

                    {/* Logo */}
                    <td className="p-4 text-center">
                      <span className="text-xl inline-block p-1.5 bg-slate-950 border border-slate-800 shadow-inner">{school.logo || '🎓'}</span>
                    </td>

                    {/* School Name */}
                    <td className="p-4">
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm hover:text-amber-700 transition-colors block">
                          {school.name}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                          <span>المستأجر: {tenants.find((tenant) => tenant.id === school.tenantId)?.legalName || school.tenantId || 'غير متحقق'}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                          <span>المدير: {school.managerName || 'غير متحقق'}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                          <span>التأسيس: {school.created_at ? new Date(school.created_at).toLocaleDateString('ar-EG') : 'غير متحقق'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Code & City */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-mono text-[10px] text-amber-700 font-bold inline-block">
                          {school.schoolCode}
                        </span>
                        <div className="text-slate-400 font-bold">{school.city || 'غير متحقق'}</div>
                      </div>
                    </td>

                    {/* Domain & Link */}
                    <td className="p-4">
                      <div className="space-y-1 font-mono">
                          <span className="text-[11px] text-slate-700 select-all block text-left font-bold" dir="ltr">
                          {school.subdomain}.erpcloud.com
                        </span>
                        <div className="flex items-center gap-1.5 text-left pt-0.5" dir="ltr">
                          <button
                            type="button"
                            onClick={() => openTrustedSchoolPortal(school)}
                            className="text-[10px] text-amber-400 hover:text-amber-300 bg-amber-950/40 border border-amber-900/60 px-2 py-0.5 rounded font-bold inline-flex items-center gap-1 hover:scale-105 transition-all cursor-pointer"
                            title="فتح بوابة المدرسة للعميل"
                          >
                            <ExternalLink className="w-3 h-3 text-amber-400" />
                            <span>فتح</span>
                          </button>
                          <span className="text-[9px] text-amber-400 flex items-center gap-0.5 font-bold">
                            <ShieldAlert className="w-3 h-3" />
                            SSL غير متحقق
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Plan & Limits */}
                    <td className="p-4">
                      <div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border inline-block ${
                          school.plan === 'Enterprise' 
                            ? 'bg-amber-950/60 border-amber-900 text-amber-400' 
                            : school.plan === 'Business'
                            ? 'bg-amber-950/60 border-amber-900 text-amber-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}>
                          {school.plan || 'أساسية'}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1.5 space-y-0.5 font-mono">
                          <div>التخزين: {school.storageLimit || 'غير متحقق'}</div>
                          <div>المستخدمين: {school.userLimit || 'غير متحقق'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold flex items-center gap-1.5 w-fit ${
                        getEffectiveSchoolStatus(school) === 'active'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' 
                          : getEffectiveSchoolStatus(school) === 'suspended'
                          ? 'bg-rose-950/40 text-rose-400 border border-rose-900/50'
                          : 'bg-slate-950 text-slate-500 border border-slate-850'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getEffectiveSchoolStatus(school) === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                        <span>
                          {getEffectiveSchoolStatus(school) === 'active' ? 'نشط وقائم' :
                           getEffectiveSchoolStatus(school) === 'suspended' ? (school.tenantStatus === 'suspended' ? 'المستأجر موقوف' : 'مجمد وموقوف') : 'مفسوخ الرابط'}
                        </span>
                      </span>
                    </td>

                    {/* Operations Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        
                        {/* Impersonate Button - SuperAdmin Only */}
                        {currentRole === 'SuperAdmin' && (
                          <button
                            onClick={() => setImpersonateTarget(school)}
                            title="الدخول الفني المحاكي كمشرف مؤقت (تتطلب بيان سبب الدخول وتوثق في سجل التدقيق)"
                            className="px-2.5 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-white transition-all cursor-pointer font-bold text-[10px] flex items-center gap-1 shadow-xs hover:scale-105"
                          >
                            <Key className="w-3.5 h-3.5 text-rose-400" />
                            <span>الدخول كمشرف مؤقت</span>
                          </button>
                        )}

                        {/* Edit details */}
                        <button
                          onClick={() => {
                            setCurrentSchool(school);
                            setShowEditModal(true);
                          }}
                          title="تعديل بيانات المدرسة"
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Adjust Licensing Limits */}
                        <button
                          onClick={() => openLimitEditor(school)}
                          title="الاشتراكات ومحددات الرخصة"
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Suspend/Freeze */}
                        <button
                          onClick={() => handleToggleFreezeSchool(school)}
                          disabled={school.tenantStatus === 'suspended'}
                          title={school.tenantStatus === 'suspended' ? 'يتطلب تفعيل المستأجر أولاً' : getEffectiveSchoolStatus(school) === 'suspended' ? 'تنشيط الخدمة' : 'تجميد مؤقت للامتثال'}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 ${
                            getEffectiveSchoolStatus(school) === 'suspended'
                              ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400 hover:bg-emerald-950/60'
                              : 'bg-amber-950/30 border-amber-900 text-amber-400 hover:bg-amber-950/60'
                          }`}
                        >
                          {getEffectiveSchoolStatus(school) === 'suspended' ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                        </button>

                        {/* Archive / Restore toggle */}
                        <button
                          onClick={() => handleToggleArchiveSchool(school)}
                          title={school.archived ? 'استعادة من الأرشيف' : 'أرشفة التخزين البارد'}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          {school.archived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                        </button>

                        {/* Terminate strictly */}
                        <button
                          onClick={() => handleTerminateSchool(school)}
                          title="إنهاء الاشتراك نهائياً"
                          className="p-1.5 rounded-lg bg-rose-950/30 border border-rose-900/60 text-rose-400 hover:bg-rose-950/60 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        {/* Soft Delete safely */}
                        <button
                          onClick={() => {
                            setCurrentSchool(school);
                            setShowDeleteModal(true);
                          }}
                          title="حذف متكامل من الخادم"
                          className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-900/20 border border-slate-800 hover:border-rose-900/60 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MODALS & WIZARDS DECLARATIONS
      ------------------------------------------------------------- */}

      {/* Modal A: Provision Tenant Wizard (Add School) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 border-b border-slate-850 p-5 flex justify-between items-center">
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white bg-slate-900 p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                تأسيس وتهيئة مستأجر مدرسة جديد (Isolated Sandbox Engine)
              </h3>
            </div>

            <form onSubmit={handleProvisionSchool} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Owning Tenant */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-400 block">المستأجر المالك للمدرسة:</label>
                  <select
                    required
                    value={newSchool.targetTenantId}
                    onChange={(e) => setNewSchool({...newSchool, targetTenantId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="">-- اختر المستأجر المركزي --</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>{tenant.legalName || tenant.legal_name} ({tenant.slug})</option>
                    ))}
                  </select>
                  {!tenants.length && <p className="text-[10px] font-bold text-rose-400">لا يمكن تأسيس مدرسة قبل اتصال دليل المستأجرين المركزي.</p>}
                </div>
                
                {/* School Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">اسم المنشأة التعليمية:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مدارس شروق المعرفة الأهلية"
                    value={newSchool.name}
                    onChange={(e) => setNewSchool({...newSchool, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Subdomain */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">النطاق الفرعي السحابي (Subdomain):</label>
                  <div className="flex bg-slate-950 border border-slate-800 rounded-lg overflow-hidden focus-within:border-amber-500">
                    <span className="bg-slate-900 border-r border-slate-800 px-3 py-2 text-slate-500 font-mono text-[10px] select-none">
                      .erpcloud.com
                    </span>
                    <input
                      type="text"
                      placeholder="shorooq"
                      value={newSchool.subdomain}
                      onChange={(e) => setNewSchool({...newSchool, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})}
                      className="w-full bg-transparent border-0 px-3 py-2 text-xs text-white focus:outline-none font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Short Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">الاسم المختصر للمدرسة (Short label):</label>
                  <input
                    type="text"
                    placeholder="مثال: شروق المعرفة"
                    value={newSchool.schoolShortName}
                    onChange={(e) => setNewSchool({...newSchool, schoolShortName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">المنطقة الجغرافية / المدينة:</label>
                  <select
                    value={newSchool.city}
                    onChange={(e) => setNewSchool({...newSchool, city: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="الرياض">الرياض (سحابة الوسطى)</option>
                    <option value="جدة">جدة (سحابة الغربية)</option>
                    <option value="الدمام">الدمام (سحابة الشرقية)</option>
                    <option value="المنامة">المنامة (سحابة البحرين)</option>
                  </select>
                </div>

                {/* Manager Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">المدير المسؤول (بيانات الملف):</label>
                    <input
                      type="text"
                      placeholder="اسم مدير المدرسة المسؤول"
                    value={newSchool.managerName}
                    onChange={(e) => setNewSchool({...newSchool, managerName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Admin Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">بريد المدير (لا ينشئ حساب دخول):</label>
                    <input
                      type="email"
                      placeholder="example@school.edu.sa"
                    value={newSchool.adminEmail}
                    onChange={(e) => setNewSchool({...newSchool, adminEmail: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    dir="ltr"
                  />
                </div>

                {/* Subscription ownership */}
                <div className="sm:col-span-2 rounded-2xl border border-amber-900/60 bg-amber-950/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black text-amber-400">اشتراك المدرسة موروث من المستأجر المركزي</span>
                    <span className="rounded-full border border-amber-700/60 bg-slate-950 px-3 py-1 text-[10px] font-black text-white">
                      {selectedTenant?.subscription?.planCode || selectedTenant?.planCode || 'غير متحقق'}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] font-bold leading-5 text-slate-400">لا تُنشئ هذه الشاشة باقة أو حصة مستقلة للمدرسة. تُدار الباقة وحد المقاعد وتاريخ الانتهاء من دليل المستأجرين المركزي حتى لا تتعدد مصادر الحقيقة.</p>
                </div>

              </div>

              <div className="p-4.5 bg-amber-950/30 border border-amber-900/60 text-xs space-y-1 text-slate-300">
                <span className="font-extrabold text-amber-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  بروتوكول عزل الحوسبة المتعددة (Tenant isolation rules):
                </span>
                <p className="leading-relaxed">عند الضغط على التأسيس، يحفظ المركز المدرسة وملفها الإداري وينشئ الفرع الرئيسي وتهيئة HR والمخزون والمالية داخل قاعدة البيانات الكانونية مع عزل RLS. لا يتم حفظ كلمات المرور ولا يتم إنشاء هوية دخول المدير من هذا النموذج.</p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  disabled={isProvisioning || !newSchool.targetTenantId}
                  className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-wait text-white font-extrabold px-6 py-2 shadow-md cursor-pointer transition-colors"
                >
                  {isProvisioning ? 'جاري الحفظ المركزي والتحقق...' : 'تأكيد وفتح المدرسة مركزيًا ⚡'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal B: Edit School Details */}
      {showEditModal && currentSchool && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 border-b border-slate-850 p-5 flex justify-between items-center">
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 bg-slate-900 p-1.5 rounded-lg border border-slate-800"><X className="w-4 h-4" /></button>
              <h3 className="text-sm font-black text-white">تعديل بيانات المنشأة والمستأجر</h3>
            </div>

            <form onSubmit={handleSaveEditSchool} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">اسم المدرسة:</label>
                  <input
                    type="text"
                    required
                    value={currentSchool.name}
                    onChange={(e) => setCurrentSchool({...currentSchool, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">الاسم المختصر:</label>
                  <input
                    type="text"
                    required
                    value={currentSchool.schoolShortName}
                    onChange={(e) => setCurrentSchool({...currentSchool, schoolShortName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">الهاتف الإداري:</label>
                  <input
                    type="text"
                    value={currentSchool.phone}
                    onChange={(e) => setCurrentSchool({...currentSchool, phone: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono text-left" dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">البريد الإلكتروني للاتصال:</label>
                  <input
                    type="email"
                    value={currentSchool.email}
                    onChange={(e) => setCurrentSchool({...currentSchool, email: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono text-left" dir="ltr"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-400 block mb-1">العنوان الجغرافي الكامل:</label>
                  <input
                    type="text"
                    value={currentSchool.address}
                    onChange={(e) => setCurrentSchool({...currentSchool, address: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400">إلغاء</button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2 rounded-xl">حفظ التغييرات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal C: Upgrade Package / Limits Slider Editor */}
      {showLimitsModal && currentSchool && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 border-b border-slate-850 p-5 flex justify-between items-center">
              <button onClick={() => setShowLimitsModal(false)} className="text-slate-400 bg-slate-900 p-1.5 rounded-lg border border-slate-800"><X className="w-4 h-4" /></button>
              <h3 className="text-sm font-black text-white">ترقيات التراخيص وحدود استخدام المستأجر</h3>
            </div>

            <form onSubmit={handleSaveLimits} className="p-6 space-y-5">
              <div className="space-y-4">
                
                {/* Subscription Plan Select */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">نوع ترخيص الاشتراك السحابي:</label>
                  <select
                    value={limitEditor.plan}
                    onChange={(e) => setLimitEditor({...limitEditor, plan: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="" disabled>غير متحقق من اشتراك المستأجر</option>
                    <option value="Standard">الباقة القياسية (Standard)</option>
                    <option value="Basic">أساسية المحدودة (Basic Plan)</option>
                    <option value="Business">متقدمة لرواد الأعمال (Business Plan)</option>
                    <option value="Enterprise">المؤسسات والشركات العملاقة (Enterprise SaaS)</option>
                  </select>
                </div>

                {/* Storage Capacity Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">تخصيص السعة التخزينية المخصصة S3 Space:</span>
                    <span className="text-amber-400 font-mono">{limitEditor.storageLimit === null ? 'غير متحقق' : `${limitEditor.storageLimit} GB`}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="2048"
                    step="10"
                    value={limitEditor.storageLimit ?? 10}
                    disabled
                    className="w-full accent-amber-500 h-2 bg-slate-950 rounded-lg cursor-not-allowed opacity-50"
                  />
                  <span className="text-[10px] text-slate-500 block">الحد الأقصى المتاح للمستأجر الفردي هو ٢ تيرا بايت قبل تفريد العتاد.</span>
                </div>

                {/* User limit input */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 block">سقف حسابات الموظفين (User limit):</label>
                    <input
                      type="number"
                      value={limitEditor.userLimit ?? ''}
                      onChange={(e) => setLimitEditor({...limitEditor, userLimit: parseInt(e.target.value)})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 block">فترة رخصة التمديد المضافة:</label>
                    <select
                      value={limitEditor.durationMonths ?? ''}
                      onChange={(e) => setLimitEditor({...limitEditor, durationMonths: e.target.value ? parseInt(e.target.value, 10) : null})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="3">٣ أشهر إضافية</option>
                      <option value="6">٦ أشهر إضافية</option>
                      <option value="12">١٢ شهر (تمديد عام كامل)</option>
                      <option value="24">٢٤ شهر (تمديد عامين)</option>
                    </select>
                  </div>
                </div>

                {/* Status Toggle in Subscription */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">الحالة العامة للاشتراك:</label>
                  <select
                    value={limitEditor.status}
                    onChange={(e) => setLimitEditor({...limitEditor, status: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="active">نشط وفعال ومفعل الدفع</option>
                    <option value="suspended">موقوف معلق (لعدم السداد)</option>
                  </select>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setShowLimitsModal(false)} className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400">إلغاء</button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-black px-6 py-2 shadow-md">حفظ وتعميد ترخيص الاشتراك 💎</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal D: Copy Settings Wizard between Schools */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 border-b border-slate-850 p-5 flex justify-between items-center">
              <button onClick={() => { resetCloneWizard(); setShowCloneModal(false); }} className="text-slate-400 bg-slate-900 p-1.5 rounded-lg border border-slate-800"><X className="w-4 h-4" /></button>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <Copy className="w-4 h-4 text-amber-400" />
                معالج استنساخ ونقل تهيئة المنشآت (Tenants Copy Settings)
              </h3>
            </div>

            <div className="p-6 space-y-5">
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Source */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 block">مدرسة المصدر (Source Template):</label>
                    <select
                      value={cloneWizard.sourceSchoolId}
                      disabled={cloneWizard.isProcessing}
                      onChange={(e) => setCloneWizard({...cloneWizard, sourceSchoolId: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="">-- اختر قالب المصدر --</option>
                      {schools.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                      ))}
                    </select>
                  </div>

                  {/* Destination */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 block">مدرسة الهدف (Target Tenant):</label>
                    <select
                      value={cloneWizard.destSchoolId}
                      disabled={cloneWizard.isProcessing}
                      onChange={(e) => setCloneWizard({...cloneWizard, destSchoolId: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="">-- اختر المدرسة المستهدفة --</option>
                      {schools.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Configurations Checklist */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 block">حدد البيانات المراد استنساخها وتعديتها للهدف:</label>
                  
                  <div className="space-y-2 bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={cloneWizard.copyAcademic}
                        disabled={cloneWizard.isProcessing}
                        onChange={(e) => setCloneWizard({...cloneWizard, copyAcademic: e.target.checked})}
                        className="rounded accent-amber-500 w-4 h-4"
                      />
                      <span className="font-bold text-white">الهيكل الأكاديمي (الترقيات، المراحل الدراسية، والصفوف والتقويم)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={cloneWizard.copyRbac}
                        disabled={cloneWizard.isProcessing}
                        onChange={(e) => setCloneWizard({...cloneWizard, copyRbac: e.target.checked})}
                        className="rounded accent-amber-500 w-4 h-4"
                      />
                      <span className="font-bold text-white">مصفوفة الصلاحيات وقوالب الأدوار المخصصة (Roles & RBAC)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={cloneWizard.copyFinance}
                        disabled={cloneWizard.isProcessing}
                        onChange={(e) => setCloneWizard({...cloneWizard, copyFinance: e.target.checked})}
                        className="rounded accent-amber-500 w-4 h-4"
                      />
                      <span className="font-bold text-white">شجرة المحاسبة والدفاتر والترميز المحاسبي العام (Finance Charts)</span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Progress and Logs block during execution */}
              {(cloneWizard.isProcessing || cloneWizard.progress > 0) && (
                <div className="space-y-2.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">جاري ترحيل وتهيئة البيانات...</span>
                    <span className="text-amber-400 font-mono font-black">{cloneWizard.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-950 border border-slate-850 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-300" 
                      style={{ width: `${cloneWizard.progress}%` }}
                    />
                  </div>

                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg max-h-24 overflow-y-auto text-left font-mono text-[9px] text-slate-300" dir="ltr">
                    {cloneWizard.logs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button 
                  type="button" 
                  disabled={cloneWizard.isProcessing}
                  onClick={() => { resetCloneWizard(); setShowCloneModal(false); }} 
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  إغلاق النافذة
                </button>
                <button 
                  type="button"
                  disabled={cloneWizard.isProcessing || cloneWizard.progress === 100}
                  onClick={handleRunCloneSettings}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-6 py-2 shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {cloneWizard.isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري النسخ...</span>
                    </>
                  ) : (
                   <span>طلب نسخ الإعدادات المركزي ⚡</span>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal E: Safe Soft Delete with Double verification entry */}
      {showDeleteModal && currentSchool && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-rose-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-rose-950/30 border-b border-rose-900/40 p-5 flex justify-between items-center text-rose-400">
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-white bg-slate-950 p-1.5 rounded-lg border border-slate-850"><X className="w-4 h-4" /></button>
              <h3 className="text-sm font-black flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" />
                 تحذير أمني: الأرشفة الآمنة للمدرسة
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                 أنت على وشك أرشفة المدرسة <strong className="text-white">[{currentSchool.name}]</strong> من الدليل المركزي. سيُغلق سجل المدرسة وفروعها منطقيًا دون حذف مادي، ولا يمكن تنفيذ الإجراء إلا بعد تأكيد الاسم المطابق.
              </p>

              <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-[10px] text-rose-300">
                 ⚠️ لسلامة الإجراء، يتطلب هذا الخيار كتابة اسم المدرسة بالكامل لتأكيد الأرشفة:
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">الاسم المطابق للتأكيد:</span>
                <div className="bg-slate-950 border border-slate-850 p-2 rounded text-xs font-bold text-white text-center font-mono select-none mb-2">
                  {currentSchool.name}
                </div>
                <input
                  type="text"
                  required
                  placeholder="اكتب اسم المدرسة هنا حرفياً..."
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full bg-slate-950 border border-rose-900/60 focus:border-rose-500 rounded-lg px-3 py-2 text-xs text-white text-center"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border border-slate-850 hover:bg-slate-800 text-slate-400">إلغاء الأمر</button>
                <button 
                  type="button" 
                  onClick={handleSafeDeleteSchool}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-5 py-2 shadow-md"
                >
                  تأكيد الحذف والتعليق الآمن 🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Impersonation Modal */}
      {impersonateTarget && (
        <ImpersonationModal
          isOpen={true}
          school={impersonateTarget}
          onClose={() => setImpersonateTarget(null)}
          onConfirm={(school, fullReason) => {
            setImpersonateTarget(null);
            if (onImpersonateSchool) {
              onImpersonateSchool(school, fullReason);
            }
          }}
        />
      )}

    </div>
  );
}
