import { Archive, Ban, Calendar, CheckCircle, Copy, Edit2, ExternalLink, FileSpreadsheet, Globe, HardDrive, Key, Layers, Lock as LockIcon, Plus, RefreshCw, RotateCcw, Search, ShieldAlert, ShieldCheck, Sliders, Sparkles, Trash2, Users, X } from 'lucide-react';
import React, { useState } from 'react';
import { initializeCOAForSchool } from '../../utils/COAUtils';
import { getTrustedSchoolUrl, openTrustedSchoolPortal } from '../../utils/EnterpriseDomainUtils';
import ImpersonationModal from './ImpersonationModal';

interface SuperAdminSchoolsProps {
  schools: any[];
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
  setSchools,
  branches = [],
  setBranches,
  logAction,
  triggerNotification,
  onSetSuccessProvision,
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

  // Active object being edited/viewed
  const [currentSchool, setCurrentSchool] = useState<any | null>(null);

  // New School Wizard state
  const [newSchool, setNewSchool] = useState({
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
    plan: 'Enterprise',
    storageLimit: '500', // GB
    userLimit: '3000',
    subscriptionDuration: '12', // Months
  });

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
    plan: 'Enterprise',
    storageLimit: 500, // GB
    userLimit: 3000,
    studentLimit: 10000,
    durationMonths: 12,
    status: 'active'
  });

  // Soft delete confirmation security state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // -------------------------------------------------------------
  // ACTIONS HANDLERS
  // -------------------------------------------------------------
  
  // Handle Add School (Provision Tenant)
  const handleProvisionSchool = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check parameters
    if (!newSchool.name || !newSchool.subdomain || !newSchool.managerName || !newSchool.adminEmail) {
      triggerNotification('يرجى تعبئة جميع الحقول الأساسية للنظام', 'warning');
      return;
    }

    // Check subdomain uniqueness
    if (schools.some(s => s.subdomain === newSchool.subdomain)) {
      triggerNotification('النطاق الفرعي مستخدم مسبقاً، اختر نطاق آخر', 'danger');
      return;
    }

    const generatedPassword = newSchool.password || Math.random().toString(36).substring(2, 10).toUpperCase();
    const newId = `school_${schools.length + 1}`;
    
    const createdSchool = {
      id: newId,
      name: newSchool.name,
      schoolShortName: newSchool.schoolShortName || newSchool.name,
      schoolCode: newSchool.schoolCode || `SCH-${Math.floor(1000 + Math.random() * 9000)}`,
      logo: '🎓',
      type: newSchool.type,
      licenseNumber: `L-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      address: newSchool.address,
      phone: newSchool.phone,
      email: newSchool.email,
      academicYear: '2026/2027',
      domain: `${newSchool.subdomain}.erpcloud.com`,
      subdomain: newSchool.subdomain,
      status: 'active',
      plan: newSchool.plan,
      storageUsed: '0 GB',
      storageLimit: `${newSchool.storageLimit} GB`,
      usersCount: 1,
      region: 'me-central1 (Dhahran)',
      backupsCount: 0,
      connectedDb: `logical_db_${newSchool.subdomain}_prod`,
      createdAt: new Date().toISOString().split('T')[0],
      country: 'المملكة العربية السعودية',
      city: newSchool.city,
      managerName: newSchool.managerName,
      adminName: newSchool.managerName,
      adminEmail: newSchool.adminEmail,
      subscriptionDuration: newSchool.subscriptionDuration,
      userLimit: newSchool.userLimit,
      subscriptionStart: new Date().toISOString().split('T')[0],
      subscriptionEnd: new Date(new Date().setMonth(new Date().getMonth() + parseInt(newSchool.subscriptionDuration))).toISOString().split('T')[0],
      lastLogin: 'لم يسجل دخول بعد',
      linkStatus: 'active',
      schoolUrl: getTrustedSchoolUrl({ id: newId, subdomain: newSchool.subdomain })
    };

    // Append default branch for this new school
    const defaultBranch = {
      id: `branch_s${schools.length + 1}_b1`,
      schoolId: newId,
      name: 'الفرع الرئيسي العام',
      city: newSchool.city,
      address: newSchool.address || 'العنوان الإداري',
      phone: newSchool.phone || 'الهاتف الإداري',
      status: 'active',
      isMain: true,
      usersCount: 1,
      studentsCount: 0,
      employeesCount: 1
    };

    setSchools(prev => [...prev, createdSchool]);
    setBranches(prev => [...prev, defaultBranch]);
    initializeCOAForSchool(newId);
    
    logAction('CREATE_SCHOOL', `تأسيس مدرسة جديدة: ${newSchool.name} بنظام Tenant معزول وقاعدة بيانات فرعية`, 'الإدارة المركزية');
    triggerNotification('تم إنشاء وتهيئة المدرسة بنجاح ✅', 'success');

    // Launch Success Modal
    if (onSetSuccessProvision) {
      onSetSuccessProvision({
        schoolName: createdSchool.name,
        subdomain: createdSchool.subdomain,
        accessLink: createdSchool.schoolUrl,
        adminName: createdSchool.managerName,
        adminEmail: createdSchool.adminEmail,
        password: generatedPassword
      });
    }

    setShowAddModal(false);
    // Reset form
    setNewSchool({
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
      plan: 'Enterprise',
      storageLimit: '500',
      userLimit: '3000',
      subscriptionDuration: '12'
    });
  };

  // Edit School
  const handleSaveEditSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSchool) return;

    setSchools(prev => prev.map(s => s.id === currentSchool.id ? currentSchool : s));
    logAction('EDIT_SCHOOL', `تحديث بيانات المستأجر: ${currentSchool.name}`, 'الإدارة المركزية');
    triggerNotification('تم تحديث البيانات بنجاح', 'success');
    setShowEditModal(false);
  };

  // Toggle school frozen/active status
  const handleToggleFreezeSchool = (school: any) => {
    const isFrozen = school.status === 'suspended';
    const newStatus = isFrozen ? 'active' : 'suspended';
    
    setSchools(prev => prev.map(s => s.id === school.id ? { ...s, status: newStatus } : s));
    
    logAction(
      isFrozen ? 'UNFREEZE_SCHOOL' : 'FREEZE_SCHOOL', 
      `${isFrozen ? 'إلغاء تجميد' : 'تجميد مؤقت'} لخدمات مدرسة: ${school.name}`, 
      'الحماية والامتثال'
    );
    
    triggerNotification(
      isFrozen ? `تم تفعيل مدرسة ${school.name} بنجاح` : `تم تعليق حساب مدرسة ${school.name} وتحويل مستخدميها لصفحة الهبوط الباردة`, 
      isFrozen ? 'success' : 'warning'
    );
  };

  // Archive School
  const handleToggleArchiveSchool = (school: any) => {
    const isArchived = !!school.archived;
    setSchools(prev => prev.map(s => s.id === school.id ? { ...s, archived: !isArchived } : s));
    
    logAction(
      isArchived ? 'RESTORE_SCHOOL' : 'ARCHIVE_SCHOOL', 
      `${isArchived ? 'استعادة مدرسة من الأرشيف السحابي' : 'أرشفة مدرسة ونقلها للمستودع البارد'}: ${school.name}`, 
      'شؤون التخزين'
    );
    
    triggerNotification(
      isArchived ? `تم فك أرشفة ${school.name} وإعادتها لقائمة العمليات` : `تمت أرشفة ${school.name} ونقل بياناتها بأمان`, 
      'info'
    );
  };

  // Permanently Terminate School services (sets status to terminated)
  const handleTerminateSchool = (school: any) => {
    if (confirm(`⚠️ تحذير أمني: هل أنت متأكد من إنهاء اشتراك مدرسة ${school.name} نهائياً وإغلاق بوابة الدخول؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      setSchools(prev => prev.map(s => s.id === school.id ? { ...s, status: 'terminated' } : s));
      logAction('TERMINATE_SCHOOL', `إغلاق خدمات وتصفية مستأجر مدرسة: ${school.name} بشكل نهائي`, 'الرقابة القضائية');
      triggerNotification(`تم تصفية وإلغاء خدمات مدرسة ${school.name} بشكل نهائي`, 'danger');
    }
  };

  // Safe soft delete with double entry check
  const handleSafeDeleteSchool = () => {
    if (!currentSchool) return;

    if (deleteConfirmText !== currentSchool.name) {
      triggerNotification('الاسم المدخل غير متطابق مع اسم المدرسة المراد حذفها', 'danger');
      return;
    }

    // Soft delete logic: filter out or flag as deleted
    setSchools(prev => prev.filter(s => s.id !== currentSchool.id));
    // Soft delete associated branches
    setBranches(prev => prev.filter(b => b.schoolId !== currentSchool.id));

    logAction('SOFT_DELETE_SCHOOL', `حذف آمن متكامل للمستأجر: ${currentSchool.name} وتجميد رخصه في قاعدة البيانات التاريخية`, 'الحوكمة');
    triggerNotification('تم حذف المدرسة وجميع فروعها وإرجاع تراخيصها بأمان ✅', 'success');
    
    setShowDeleteModal(false);
    setDeleteConfirmText('');
    setCurrentSchool(null);
  };

  // Update subscription limits & packages
  const handleSaveLimits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSchool) return;

    // Calculate end date based on duration
    const currentStart = new Date(currentSchool.subscriptionStart || new Date());
    const newEnd = new Date(currentStart.setMonth(currentStart.getMonth() + limitEditor.durationMonths)).toISOString().split('T')[0];

    setSchools(prev => prev.map(s => s.id === currentSchool.id ? {
      ...s,
      plan: limitEditor.plan,
      storageLimit: `${limitEditor.storageLimit} GB`,
      userLimit: limitEditor.userLimit.toString(),
      subscriptionEnd: newEnd,
      status: limitEditor.status
    } : s));

    logAction(
      'UPDATE_LIMITS', 
      `تعديل رخص واشتراك ${currentSchool.name}: الباقة [${limitEditor.plan}]، سعة تخزين [${limitEditor.storageLimit} GB]، مستخدمين [${limitEditor.userLimit}]`, 
      'الاشتراكات والتراخيص'
    );
    triggerNotification('تم تعديل رخصة الاشتراك وحفظ القيود الجديدة بنجاح', 'success');
    setShowLimitsModal(false);
  };

  // Clone Copy Settings Wizard Simulator
  const handleRunCloneSettings = () => {
    if (!cloneWizard.sourceSchoolId || !cloneWizard.destSchoolId) {
      triggerNotification('يرجى اختيار مدرسة المصدر ومدرسة الهدف للنسخ', 'warning');
      return;
    }
    if (cloneWizard.sourceSchoolId === cloneWizard.destSchoolId) {
      triggerNotification('لا يمكن نسخ الإعدادات لنفس المدرسة', 'warning');
      return;
    }

    const srcName = schools.find(s => s.id === cloneWizard.sourceSchoolId)?.name || 'مدرسة المصدر';
    const destName = schools.find(s => s.id === cloneWizard.destSchoolId)?.name || 'مدرسة الهدف';

    setCloneWizard(prev => ({ 
      ...prev, 
      isProcessing: true, 
      progress: 5, 
      logs: [`[01:12] بدء محاذاة البيانات الكلية للمستأجرين...`] 
    }));

    // Step 1: Read config
    setTimeout(() => {
      setCloneWizard(prev => ({ 
        ...prev, 
        progress: 30, 
        logs: [...prev.logs, `[01:13] تم استخراج قوالب الهيكل الأكاديمي والصفوف والتقاويم من [${srcName}].`] 
      }));
    }, 1000);

    // Step 2: Permissions copy
    setTimeout(() => {
      setCloneWizard(prev => ({ 
        ...prev, 
        progress: 65, 
        logs: [...prev.logs, `[01:15] تم نسخ مصفوفات صلاحيات الأدوار (RBAC Rules Template) المدمجة.`] 
      }));
    }, 2000);

    // Step 3: Financial settings copy if enabled
    setTimeout(() => {
      const financeLog = cloneWizard.copyFinance 
        ? `[01:17] تم نسخ شجرة الحسابات والدفاتر ومراكز التكلفة المحاسبية.` 
        : `[01:17] تم تجاوز استنساخ الشق المالي بناء على خيارات المشرف.`;
      
      setCloneWizard(prev => ({ 
        ...prev, 
        progress: 90, 
        logs: [...prev.logs, financeLog] 
      }));
    }, 3000);

    // Step 4: Finalize
    setTimeout(() => {
      setCloneWizard(prev => ({ 
        ...prev, 
        progress: 100, 
        isProcessing: false,
        logs: [...prev.logs, `[01:18] اكتمل نسخ الإعدادات وتخصيص البنية بشكل آمن ١٠٠٪ بنجاح.`] 
      }));
      
      logAction(
        'COPY_SCHOOL_SETTINGS', 
        `استنساخ إعدادات وهياكل الحوكمة والأكاديمية من [${srcName}] إلى [${destName}] بنجاح كلي`, 
        'شؤون البنية والتهيئة'
      );
      triggerNotification('تمت عملية نسخ وتهيئة الإعدادات بنجاح 📋', 'success');
    }, 4000);
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
    const rawStorage = parseInt(school.storageLimit) || 500;
    const rawUsers = parseInt(school.userLimit) || 3000;
    
    setLimitEditor({
      plan: school.plan || 'Enterprise',
      storageLimit: rawStorage,
      userLimit: rawUsers,
      studentLimit: school.plan === 'Enterprise' ? 10000 : school.plan === 'Business' ? 5000 : 2000,
      durationMonths: parseInt(school.subscriptionDuration) || 12,
      status: school.status || 'active'
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
      return school.status === selectedStatus && !school.archived;
    };

    return matchesSearch && matchesCity && matchesPlan && matchesStatus();
  });

  return (
    <div className="space-y-5 text-right animate-in fade-in duration-200" dir="rtl">
      
      {/* Search and Action Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
        
        {/* Actions button */}
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-initial bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
          >
            <Plus className="w-4 h-4" />
            <span>تأسيس مستأجر مدرسة جديدة</span>
          </button>

          <button
            onClick={() => setShowCloneModal(true)}
            className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-amber-400 hover:text-amber-300 px-3.5 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
          >
            <Copy className="w-4 h-4" />
            <span>نسخ وتهيئة الإعدادات</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full md:max-w-md bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <Search className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
          <input
            type="text"
            placeholder="بحث في مدارس المستأجرين (الاسم، الرمز، النطاق الفرعي...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 pr-9 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
          />
        </div>

      </div>

      {/* Advanced Filter Pills Row */}
      <div className="flex flex-wrap gap-4 items-center bg-slate-900/40 p-4 border border-slate-800/80 text-xs">
        <span className="text-slate-400 font-bold">فلترة متقدمة:</span>
        
        {/* City Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">المدينة:</span>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500"
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
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500"
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
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500"
          >
            <option value="all">نشطة (غير مؤرشفة)</option>
            <option value="active">نشطة (Active)</option>
            <option value="suspended">موقوفة/مجمدة</option>
            <option value="trial">تجريبية</option>
            <option value="terminated">منتهية الخدمة</option>
            <option value="archived">المؤرشفة فقط 📥</option>
          </select>
        </div>

        {/* Results Counter */}
        <div className="mr-auto text-[10px] bg-slate-950/60 border border-slate-800 rounded px-2.5 py-1 text-slate-400 font-mono">
          تم العثور على: {filteredSchools.length} مدرسة
        </div>

      </div>

      {/* Main Grid / Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-sans">
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
                  <tr key={school.id} className="hover:bg-slate-950/40 transition-colors group">
                    
                    {/* Index */}
                    <td className="p-4 text-center text-slate-500 font-mono font-bold w-8">{idx + 1}</td>

                    {/* Logo */}
                    <td className="p-4 text-center">
                      <span className="text-xl inline-block p-1.5 bg-slate-950 border border-slate-800 shadow-inner">{school.logo || '🎓'}</span>
                    </td>

                    {/* School Name */}
                    <td className="p-4">
                      <div>
                        <span className="font-extrabold text-white text-sm hover:text-amber-400 transition-colors block">
                          {school.name}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                          <span>المدير: {school.managerName || 'أ. سليمان بن غازي'}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                          <span>التأسيس: {school.createdAt}</span>
                        </div>
                      </div>
                    </td>

                    {/* Code & City */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className="bg-slate-950 border border-slate-850 px-2 py-0.5 rounded font-mono text-[10px] text-amber-400 font-bold inline-block">
                          {school.schoolCode}
                        </span>
                        <div className="text-slate-400 font-bold">{school.city || 'الرياض'}</div>
                      </div>
                    </td>

                    {/* Domain & Link */}
                    <td className="p-4">
                      <div className="space-y-1 font-mono">
                        <span className="text-[11px] text-slate-300 select-all block text-left font-bold" dir="ltr">
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
                          <span className="text-[9px] text-emerald-400 flex items-center gap-0.5 font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            SSL
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
                          <div>التخزين: {school.storageLimit || '٥٠٠ جيجا'}</div>
                          <div>المستخدمين: {school.userLimit || 'غير محدود'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold flex items-center gap-1.5 w-fit ${
                        school.status === 'active' 
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' 
                          : school.status === 'suspended'
                          ? 'bg-rose-950/40 text-rose-400 border border-rose-900/50'
                          : 'bg-slate-950 text-slate-500 border border-slate-850'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${school.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                        <span>
                          {school.status === 'active' ? 'نشط وقائم' : 
                           school.status === 'suspended' ? 'مجمد وموقوف' : 'مفسوخ الرابط'}
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
                          title={school.status === 'suspended' ? 'تنشيط الخدمة' : 'تجميد مؤقت للامتثال'}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            school.status === 'suspended'
                              ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400 hover:bg-emerald-950/60'
                              : 'bg-amber-950/30 border-amber-900 text-amber-400 hover:bg-amber-950/60'
                          }`}
                        >
                          {school.status === 'suspended' ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
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
                      required
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
                  <label className="text-xs font-bold text-slate-400 block">المدير المسؤول (صاحب الحساب):</label>
                  <input
                    type="text"
                    required
                    placeholder="اسم مدير المدرسة المسؤول"
                    value={newSchool.managerName}
                    onChange={(e) => setNewSchool({...newSchool, managerName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Admin Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">البريد الإلكتروني للولوج والتأسيس:</label>
                  <input
                    type="email"
                    required
                    placeholder="example@school.edu.sa"
                    value={newSchool.adminEmail}
                    onChange={(e) => setNewSchool({...newSchool, adminEmail: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    dir="ltr"
                  />
                </div>

                {/* Temporary Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">كلمة المرور المؤقتة (تترك فارغة للتوليد العشوائي):</label>
                  <input
                    type="text"
                    placeholder="توليد تلقائي مشفر..."
                    value={newSchool.password}
                    onChange={(e) => setNewSchool({...newSchool, password: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                {/* Subscription Plan */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">باقة الاشتراك المبدئية:</label>
                  <select
                    value={newSchool.plan}
                    onChange={(e) => setNewSchool({...newSchool, plan: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Basic">الأساسية (Basic)</option>
                    <option value="Business">الأعمال (Business)</option>
                    <option value="Enterprise">المؤسسات الكبرى (Enterprise)</option>
                  </select>
                </div>

                {/* Subscription Duration */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">فترة رخصة التفعيل:</label>
                  <select
                    value={newSchool.subscriptionDuration}
                    onChange={(e) => setNewSchool({...newSchool, subscriptionDuration: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="3">٣ أشهر (نسخة تجريبية)</option>
                    <option value="6">٦ أشهر</option>
                    <option value="12">١٢ شهر (ترخيص سنوي)</option>
                    <option value="24">٢٤ شهر (عامين)</option>
                  </select>
                </div>

                {/* Storage Limit */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">مساحة التخزين المستهدفة (GB):</label>
                  <select
                    value={newSchool.storageLimit}
                    onChange={(e) => setNewSchool({...newSchool, storageLimit: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="100">100 GB</option>
                    <option value="250">250 GB</option>
                    <option value="500">500 GB (Enterprise default)</option>
                    <option value="1024">1 TB (1024 GB)</option>
                  </select>
                </div>

              </div>

              <div className="p-4.5 bg-amber-950/30 border border-amber-900/60 text-xs space-y-1 text-slate-300">
                <span className="font-extrabold text-amber-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  بروتوكول عزل الحوسبة المتعددة (Tenant isolation rules):
                </span>
                <p className="leading-relaxed">عند الضغط على تفعيل، سيقوم معالج السحابة بتخصيص خادم قواعد بيانات منطقي فرعي، وتخصيص RLS مستقل، مع إنشاء فرع رئيسي للمدرسة وحساب المسؤول مع توليد رابط الولوج الآمن.</p>
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
                  className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-6 py-2 shadow-md cursor-pointer transition-colors"
                >
                  تأكيد وتأسيس الخادم السحابي ⚡
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
                    <option value="Basic">أساسية المحدودة (Basic Plan)</option>
                    <option value="Business">متقدمة لرواد الأعمال (Business Plan)</option>
                    <option value="Enterprise">المؤسسات والشركات العملاقة (Enterprise SaaS)</option>
                  </select>
                </div>

                {/* Storage Capacity Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">تخصيص السعة التخزينية المخصصة S3 Space:</span>
                    <span className="text-amber-400 font-mono">{limitEditor.storageLimit} GB</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="2048"
                    step="10"
                    value={limitEditor.storageLimit}
                    onChange={(e) => setLimitEditor({...limitEditor, storageLimit: parseInt(e.target.value)})}
                    className="w-full accent-amber-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 block">الحد الأقصى المتاح للمستأجر الفردي هو ٢ تيرا بايت قبل تفريد العتاد.</span>
                </div>

                {/* User limit input */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 block">سقف حسابات الموظفين (User limit):</label>
                    <input
                      type="number"
                      value={limitEditor.userLimit}
                      onChange={(e) => setLimitEditor({...limitEditor, userLimit: parseInt(e.target.value)})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 block">فترة رخصة التمديد المضافة:</label>
                    <select
                      value={limitEditor.durationMonths}
                      onChange={(e) => setLimitEditor({...limitEditor, durationMonths: parseInt(e.target.value)})}
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
                    <option value="trial">تجريبي مجاني (Trial)</option>
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
                    <span>تشغيل معالج النسخ المباشر ⚡</span>
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
                تحذير أمني: الحذف الآمن للمستأجر
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                أنت على وشك القيام بحذف المدرسة <strong className="text-white">[{currentSchool.name}]</strong> من محرك العمليات السريع. سيؤدي هذا الإجراء لتعليق فوري لقنوات الدخول، وإخفاء بيانات الفروع المرتبطة وتجنيبها، لحمايتها من التدمير غير المقصود.
              </p>

              <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-[10px] text-rose-300">
                ⚠️ لسلامة الإجراء، يتطلب هذا الخيار كتابة الاسم المطابق للمستأجر بالكامل لتأكيد الحذف:
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
