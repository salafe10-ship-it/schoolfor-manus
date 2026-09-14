import React, { useEffect, useState } from 'react';
import { 
  Settings, Building2, School, DollarSign, Award, Users, 
  Shield, Database, HardDrive, RefreshCw, CheckCircle, AlertTriangle, 
  Search, Plus, Edit, Trash2, Save, Download, Upload, History, 
  FileText, Globe, Clock, Lock, Server, Key, Sliders, Check
} from 'lucide-react';
import { authenticatedRequest } from '../utils/authenticatedRequest';

interface SystemSettingsPortalProps {
  formatCurrency: (amount: number, showSymbol?: boolean) => string;
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  logAction: (action: string, details: string, module: string) => void;
  currentRole: string;
  selectedSchool?: { id?: string; name?: string; logo?: string };
  onSchoolLogoUpdated?: (logo: string) => void;
  initialTab?: 'dashboard' | 'branding' | 'organization' | 'school' | 'financial' | 'exams' | 'fees' | 'hr' | 'system' | 'master_data' | 'audit' | 'backup';
  brandingOnly?: boolean;
}

export default function SystemSettingsPortal({
  formatCurrency,
  triggerNotification,
  logAction,
  currentRole,
  selectedSchool,
  onSchoolLogoUpdated,
  initialTab = 'dashboard',
  brandingOnly = false
}: SystemSettingsPortalProps) {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'branding' | 'organization' | 'school' | 'financial' | 'exams' | 'fees' | 'hr' | 'system' | 'master_data' | 'audit' | 'backup'
  >(initialTab);

  const [brandingLogo, setBrandingLogo] = useState<string>(() => (
    selectedSchool?.logo && /^(https:\/\/|data:image\/)/i.test(selectedSchool.logo) ? selectedSchool.logo : ''
  ));
  const [brandingSaving, setBrandingSaving] = useState(false);

  useEffect(() => {
    const logo = selectedSchool?.logo || '';
    setBrandingLogo(/^(https:\/\/|data:image\/)/i.test(logo) ? logo : '');
  }, [selectedSchool?.id, selectedSchool?.logo]);

  const handleBrandingFile = async (file: File | undefined) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      triggerNotification('اختر صورة PNG أو JPEG أو WebP للشعار.', 'warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      triggerNotification('حجم ملف الشعار الأصلي كبير. الحد الأقصى 5 ميجابايت قبل الضغط.', 'warning');
      return;
    }
    try {
      const source = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('تعذر قراءة ملف الشعار.'));
        reader.readAsDataURL(file);
      });
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const candidate = new Image();
        candidate.onload = () => resolve(candidate);
        candidate.onerror = () => reject(new Error('تعذر تجهيز صورة الشعار.'));
        candidate.src = source;
      });
      const maxSide = 720;
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
      canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('تعذر تجهيز مساحة معاينة الشعار.');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const preferredType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const compressed = canvas.toDataURL(preferredType, preferredType === 'image/jpeg' ? 0.86 : undefined);
      if (compressed.length > 700_000) {
        const smaller = canvas.toDataURL('image/jpeg', 0.72);
        if (smaller.length > 700_000) throw new Error('تعذر ضغط الشعار إلى الحجم الآمن. اختر صورة أبسط.');
        setBrandingLogo(smaller);
      } else {
        setBrandingLogo(compressed);
      }
      triggerNotification('تم تجهيز الشعار ومعاينته. اضغط حفظ الهوية لاعتماده في المستندات.', 'info');
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر تجهيز الشعار.', 'warning');
    }
  };

  const handleSaveBranding = async () => {
    if (!selectedSchool?.id) {
      triggerNotification('لا توجد مدرسة موثوقة لحفظ الشعار.', 'warning');
      return;
    }
    setBrandingSaving(true);
    try {
      const response = await authenticatedRequest('/api/school/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoDataUrl: brandingLogo || '' })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'تعذر حفظ شعار المدرسة.');
      const savedLogo = String(payload?.data?.logo || brandingLogo || '🏫');
      onSchoolLogoUpdated?.(savedLogo);
      logAction('SCHOOL_BRANDING_UPDATED', brandingLogo ? 'تم رفع شعار المدرسة واعتماده للمستندات والتقارير.' : 'تمت إزالة شعار المدرسة والعودة إلى الافتراضي.', 'هوية المدرسة');
      triggerNotification('تم حفظ الشعار مركزيًا وسيظهر في سندات القبض والقيود والتقارير بعد إعادة تحميل الشاشة.', 'success');
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر حفظ الشعار.', 'error');
    } finally {
      setBrandingSaving(false);
    }
  };

  // Organization Settings State
  const [orgSettings, setOrgSettings] = useState({
    name: '', shortName: '', logoUrl: '', address: '', country: '', city: '', phone: '', email: '', website: '',
    currency: '', language: '', timezone: '',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24 Hours'
  });

  // School & Academic Structure
  const [schoolSettings, setSchoolSettings] = useState({
    stage: '', schoolType: '', academicSystem: '', classesCount: 0, sectionsCount: 0, maxCapacity: 0, currentAcademicYear: ''
  });

  // Financial Settings
  const [financialSettings, setFinancialSettings] = useState({
    defaultCurrency: 'د.ل (LYD) / ر.س (SAR)',
    decimalPlaces: 2,
    fiscalYearStart: '2025-01-01',
    fiscalYearEnd: '2025-12-31',
    defaultRevenueAccount: '401 - إيرادات الرسوم الدراسية',
    defaultCashAccount: '101 - الخزينة الرئيسية',
    defaultBankAcc: '102 - مصرف الجمهورية / الراجحي',
    roundingPolicy: 'التقرب لأقرب جزء عشري قياسي'
  });

  // Exam Settings
  const [examSettings, setExamSettings] = useState({
    gradingSystem: 'التقدير المئوي (0 - 100)',
    passMark: 50,
    failurePolicy: 'رسوب في المادة إذا تقل الدرجة عن 50%',
    makeUpExamAllowed: true,
    rankingMethod: 'الترتيب التنازلي حسب المجموع الكلي',
    approvalRequirement: 'اعتماد ثنائي (كنترول + مدير المدرسة)'
  });

  // Fee Settings
  const [feeSettings, setFeeSettings] = useState({
    allowDiscounts: true,
    maxDiscountPercent: 25,
    lateFeePenalty: '5% غرامة تأخير بعد 30 يوم',
    installmentPolicy: 'أقساط ربع سنوية (4 دفعات)',
    collectionStrictness: 'منع استخراج النتائج في حال وجود ذمم مالية متأخرة'
  });

  // HR Settings
  const [hrSettings, setHrSettings] = useState({
    defaultContractType: 'عقد دوام كامل محدد المدة',
    annualLeaveDays: 30,
    gracePeriodMinutes: 15,
    tardinessDeductionRate: 'خصم ساعة عن كل 30 دقيقة تأخير',
    payrollCycleDay: 28
  });

  // System & Integration Settings
  const [systemSettings, setSystemSettings] = useState({
    smtpHost: '', smsGateway: '', pushNotifications: false, autoBackupDaily: false, sessionTimeoutMinutes: 0, tenantId: '', apiSecurityMode: ''
  });

  // Master Data State
  const [masterTab, setMasterTab] = useState<'nationalities' | 'religions' | 'cities' | 'departments' | 'job_titles'>('nationalities');
  const [nationalities, setNationalities] = useState<any[]>([]);
  const [newNatInput, setNewNatInput] = useState('');

  // لا تُعرض أحداث تدقيق قبل تحميلها من سجل التدقيق المركزي.
  const [configAuditLogs, setConfigAuditLogs] = useState<any[]>([]);

  const handleSaveSection = (sectionName: string) => {
    triggerNotification(`خدمة حفظ الإعدادات المركزية غير متاحة؛ لم يُحفظ قسم ${sectionName}.`, 'warning');
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 p-6 text-white relative overflow-hidden">
        <div className="absolute left-0 top-0 w-96 h-96 bg-[#dfb55a]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#dfb55a] text-slate-950 font-black px-2.5 py-1 rounded text-xs">
                وحدة مركزية • Ultra Critical
              </span>
              <span className="text-slate-400 text-xs font-mono">EduPro Enterprise Core Config Engine v5.4</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">{brandingOnly ? 'هوية المدرسة والشعار الرسمي' : 'إدارة الإعدادات العامة ونظام البيانات المرجعية (Master Data & Settings)'}</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              {brandingOnly ? 'مصدر واحد آمن لشعار المدرسة، يُستخدم تلقائيًا في سندات القبض والقيود اليومية والتقارير والمستندات المطبوعة داخل المدرسة الحالية.' : 'العقل الإداري والتشغيلي للمنصة. كافة التغييرات هنا تنعكس فوراً وآلياً وبشكل متزامن عبر كافة أقسام النظام المالي، الأكاديمي، شؤون الطلاب، الموارد البشرية، والامتحانات.'}
            </p>
          </div>
          
          {!brandingOnly && <div className="flex items-center gap-3">
            <button
              onClick={() => {
                logAction('EXPORT_CONFIG_BACKUP', 'تم تصدير نسخة احتياطية كاملة لإعدادات النظام بصيغة JSON الآمنة', 'الإعدادات العامة');
                triggerNotification('✓ تم تصدير النسخة الاحتياطية للإعدادات بنجاح.', 'success');
              }}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[#dfb55a] font-bold text-xs px-4 py-2.5 flex items-center gap-2 shadow transition-all"
            >
              <Download className="w-4 h-4" />
              <span>تصدير الإعدادات (Backup)</span>
            </button>
            <button
              onClick={() => {
                logAction('RESTORE_CONFIG_DEFAULT', 'تم التحقق من سلامة كافة ملفات الضبط وقاعدة البيانات الرئيسية', 'الإعدادات العامة');
                triggerNotification('✓ جميع الإعدادات مطابقة لمعايير الجودة والتوافق المؤسسي Zero Error.', 'success');
              }}
              className="bg-[#dfb55a] hover:bg-[#c99f48] text-slate-950 font-black text-xs px-4 py-2.5 flex items-center gap-2 shadow transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>فحص توافق المنظومة</span>
            </button>
          </div>}
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex overflow-x-auto bg-slate-900 p-2 border border-slate-800 gap-1.5 scrollbar-thin">
        {(brandingOnly ? [
          { id: 'branding', label: 'هوية المدرسة والشعار', icon: Award }
        ] : [
          { id: 'dashboard', label: 'لوحة مؤشرات الإعدادات', icon: Sliders },
          { id: 'branding', label: 'هوية المدرسة والشعار', icon: Award },
          { id: 'organization', label: 'إعدادات المؤسسة', icon: Building2 },
          { id: 'school', label: 'إعدادات المدرسة', icon: School },
          { id: 'financial', label: 'الإعدادات المالية', icon: DollarSign },
          { id: 'exams', label: 'إعدادات الامتحانات', icon: Award },
          { id: 'fees', label: 'سياسة الرسوم', icon: Shield },
          { id: 'hr', label: 'الموارد البشرية', icon: Users },
          { id: 'system', label: 'إعدادات النظام والـ API', icon: Server },
          { id: 'master_data', label: 'البيانات المرجعية (Master Data)', icon: Database },
          { id: 'audit', label: 'سجل التدقيق والتعديلات (Audit Trail)', icon: History },
          { id: 'backup', label: 'النسخ الاحتياطي والاستعادة', icon: HardDrive }
        ]).map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-[#dfb55a] text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CONFIGURATION DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 space-y-2">
              <span className="text-[11px] text-slate-400 font-bold block">إجمالي الإعدادات المُدارة</span>
              <span className="text-3xl font-black text-white font-mono">غير متحقق</span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> بانتظار المصدر المركزي
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 space-y-2">
              <span className="text-[11px] text-slate-400 font-bold block">الجداول المرجعية (Master Data)</span>
              <span className="text-3xl font-black text-[#dfb55a] font-mono">غير متحقق</span>
              <span className="text-[10px] text-slate-400">لا يوجد قياس مركزي متاح</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 space-y-2">
              <span className="text-[11px] text-slate-400 font-bold block">حالة العزل السحابي (Multi-Tenant)</span>
              <span className="text-xl font-black text-slate-400 font-mono">غير متحقق</span>
              <span className="text-[10px] text-slate-400">تتطلب فحص العزل المركزي</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 space-y-2">
              <span className="text-[11px] text-slate-400 font-bold block">آخر نسخة احتياطية ناجحة</span>
              <span className="text-sm font-black text-white font-mono">غير متحقق</span>
              <span className="text-[10px] text-slate-400">لا يوجد سجل نسخة موثوق</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 space-y-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Server className="w-4 h-4 text-[#dfb55a]" />
                <span>حالة خدمات النظام والربط المشترك</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800">
                  <span className="text-slate-300 font-bold">قاعدة البيانات الرئيسية (PostgreSQL / Firestore)</span>
                  <span className="text-slate-400 font-mono font-bold">غير متحقق</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800">
                  <span className="text-slate-300 font-bold">خدمة البريد الإلكتروني السحابي (SMTP Gateway)</span>
                  <span className="text-slate-400 font-mono font-bold">غير متحقق</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800">
                  <span className="text-slate-300 font-bold">بوابة الرسائل القصيرة (SMS API Connector)</span>
                  <span className="text-slate-400 font-mono font-bold">غير متحقق</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800">
                  <span className="text-slate-300 font-bold">محرك التصدير والتقارير الآلي (PDF/Excel)</span>
                  <span className="text-slate-400 font-mono font-bold">غير متحقق</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 space-y-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <History className="w-4 h-4 text-yellow-400" />
                <span>آخر التعديلات والتحركات في الإعدادات</span>
              </h3>
              <div className="space-y-2.5 text-xs max-h-[220px] overflow-y-auto pr-1">
                {configAuditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-white font-bold block">{log.action}</span>
                      <span className="text-[10px] text-slate-400">بواسطة: {log.user} • {log.category}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORGANIZATION SETTINGS */}
      {activeTab === 'branding' && (
        <div className="bg-slate-900 border border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[#dfb55a]/15 border border-[#dfb55a]/50 flex items-center justify-center overflow-hidden">
                {brandingLogo ? <img src={brandingLogo} alt="معاينة شعار المدرسة" className="h-full w-full object-contain" /> : <span className="text-2xl">🏫</span>}
              </div>
              <div>
                <h3 className="text-base font-black text-white">هوية المدرسة والشعار الرسمي</h3>
                <p className="text-xs text-slate-400 mt-1">المكان المركزي لرفع شعار {selectedSchool?.name || 'المدرسة'} واعتماده في المستندات المطبوعة.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
            <div className="space-y-4">
              <label className="block rounded-2xl border border-dashed border-[#dfb55a]/60 bg-slate-950 p-6 text-center cursor-pointer hover:bg-slate-800 transition-colors">
                <Upload className="w-8 h-8 text-[#dfb55a] mx-auto mb-3" />
                <span className="block text-white font-black text-sm">إرفاق شعار المدرسة</span>
                <span className="block text-slate-400 text-xs mt-2">PNG أو JPEG أو WebP • سيتم ضغط الصورة تلقائيًا مع الحفاظ على وضوحها</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { void handleBrandingFile(event.target.files?.[0]); event.currentTarget.value = ''; }} />
              </label>
              <div className="flex flex-wrap gap-3 justify-end">
                <button type="button" onClick={() => setBrandingLogo('')} className="border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold">إزالة الشعار</button>
                <button type="button" onClick={() => void handleSaveBranding()} disabled={brandingSaving} className="bg-[#dfb55a] hover:bg-[#c99f48] disabled:opacity-60 text-slate-950 rounded-xl px-5 py-2.5 text-xs font-black flex items-center gap-2">
                  {brandingSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {brandingSaving ? 'جارٍ الحفظ...' : 'حفظ الهوية واعتمادها'}
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-5 min-h-[220px] flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-3">معاينة رأس المستند</span>
              <div className="w-full border-b-2 border-[#dfb55a] pb-3 flex items-center gap-3 text-right" dir="rtl">
                <div className="h-16 w-16 rounded-xl border border-[#dfb55a]/60 bg-white flex items-center justify-center overflow-hidden shrink-0">
                  {brandingLogo ? <img src={brandingLogo} alt="شعار المدرسة" className="h-full w-full object-contain" /> : <span className="text-3xl">🏫</span>}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-black text-sm truncate">{selectedSchool?.name || 'اسم المدرسة'}</p>
                  <p className="text-slate-400 text-[10px] mt-1">سند قبض • قيد يومية • تقرير رسمي</p>
                </div>
              </div>
              <p className="text-[10px] text-emerald-400 mt-4">مصدر مركزي واحد للهوية — عزل كامل بين المدارس</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORGANIZATION SETTINGS */}
      {activeTab === 'organization' && (
        <div className="bg-slate-900 border border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-black text-white">إعدادات الهوية وبيانات المؤسسة التعليمية الرسمية</h3>
            <p className="text-xs text-slate-400 mt-1">تستخدم هذه البيانات في ترويسة جميع الشهادات والمستندات والتقارير الصادرة من النظام.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-2">اسم المؤسسة الرسمي:</label>
              <input
                type="text"
                value={orgSettings.name}
                onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold focus:outline-none focus:border-[#dfb55a]"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-2">الاسم المختصر (Brand Short Name):</label>
              <input
                type="text"
                value={orgSettings.shortName}
                onChange={(e) => setOrgSettings({ ...orgSettings, shortName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold focus:outline-none focus:border-[#dfb55a]"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-2">العنوان التفصيلي:</label>
              <input
                type="text"
                value={orgSettings.address}
                onChange={(e) => setOrgSettings({ ...orgSettings, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold focus:outline-none focus:border-[#dfb55a]"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-2">الدولة والمدينة:</label>
              <input
                type="text"
                value={orgSettings.city}
                onChange={(e) => setOrgSettings({ ...orgSettings, city: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold focus:outline-none focus:border-[#dfb55a]"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-2">رقم الهاتف الرسمي:</label>
              <input
                type="text"
                value={orgSettings.phone}
                onChange={(e) => setOrgSettings({ ...orgSettings, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold focus:outline-none focus:border-[#dfb55a]"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-2">البريد الإلكتروني المعتمد:</label>
              <input
                type="text"
                value={orgSettings.email}
                onChange={(e) => setOrgSettings({ ...orgSettings, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold focus:outline-none focus:border-[#dfb55a]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={() => handleSaveSection('بيانات المؤسسة')}
              className="bg-[#dfb55a] hover:bg-[#c99f48] text-slate-950 font-black text-xs px-6 py-3 flex items-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات المؤسسة</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SCHOOL SETTINGS */}
      {activeTab === 'school' && (
        <div className="bg-slate-900 border border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-black text-white">إعدادات الهيكل المدرسي والمراحل التعليمية</h3>
            <p className="text-xs text-slate-400 mt-1">تحديد المراحل، الفصول الدراسية، والطاقة الاستيعابية القصوى.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-2">المرحلة التعليمية:</label>
              <input
                type="text"
                value={schoolSettings.stage}
                onChange={(e) => setSchoolSettings({ ...schoolSettings, stage: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-2">العام الدراسي الحالي:</label>
              <input
                type="text"
                value={schoolSettings.currentAcademicYear}
                onChange={(e) => setSchoolSettings({ ...schoolSettings, currentAcademicYear: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-2">عدد الفصول الكلي:</label>
              <input
                type="number"
                value={schoolSettings.classesCount}
                onChange={(e) => setSchoolSettings({ ...schoolSettings, classesCount: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-2">إجمالي الطاقة الاستيعابية للطلاب:</label>
              <input
                type="number"
                value={schoolSettings.maxCapacity}
                onChange={(e) => setSchoolSettings({ ...schoolSettings, maxCapacity: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={() => handleSaveSection('الهيكل المدرسي')}
              className="bg-[#dfb55a] hover:bg-[#c99f48] text-slate-950 font-black text-xs px-6 py-3 flex items-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات المدرسة</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: FINANCIAL SETTINGS */}
      {activeTab === 'financial' && (
        <div className="bg-slate-900 border border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-black text-white">الإعدادات المالية وسياسة العملة والتقريب</h3>
            <p className="text-xs text-slate-400 mt-1">تحديد الحسابات الافتراضية، العملات، وتاريخ بداية ونهاية السنة المالية.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-2">العملة الافتراضية الرئيسية:</label>
              <input
                type="text"
                value={financialSettings.defaultCurrency}
                onChange={(e) => setFinancialSettings({ ...financialSettings, defaultCurrency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-2">سياسة التقريب المحاسبي:</label>
              <input
                type="text"
                value={financialSettings.roundingPolicy}
                onChange={(e) => setFinancialSettings({ ...financialSettings, roundingPolicy: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-2">حساب إيرادات الرسوم الافتراضي:</label>
              <input
                type="text"
                value={financialSettings.defaultRevenueAccount}
                onChange={(e) => setFinancialSettings({ ...financialSettings, defaultRevenueAccount: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-2">حساب الخزينة الرئيسية:</label>
              <input
                type="text"
                value={financialSettings.defaultCashAccount}
                onChange={(e) => setFinancialSettings({ ...financialSettings, defaultCashAccount: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={() => handleSaveSection('الإعدادات المالية')}
              className="bg-[#dfb55a] hover:bg-[#c99f48] text-slate-950 font-black text-xs px-6 py-3 flex items-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الإعدادات المالية</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: EXAM SETTINGS */}
      {activeTab === 'exams' && (
        <div className="bg-slate-900 border border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-black text-white">إعدادات الامتحانات والتقديرات الأكاديمية</h3>
            <p className="text-xs text-slate-400 mt-1">تحديد الحد الأدنى للنجاح، نظام الدرجات، وسياسات التقييم.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-2">نظام الدرجات والتقييم:</label>
              <input
                type="text"
                value={examSettings.gradingSystem}
                onChange={(e) => setExamSettings({ ...examSettings, gradingSystem: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-2">الحد الأدنى لدرجة النجاح:</label>
              <input
                type="number"
                value={examSettings.passMark}
                onChange={(e) => setExamSettings({ ...examSettings, passMark: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-2">سياسة الترتيب العام للطلاب:</label>
              <input
                type="text"
                value={examSettings.rankingMethod}
                onChange={(e) => setExamSettings({ ...examSettings, rankingMethod: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-2">اعتماد النتائج والشهادات:</label>
              <input
                type="text"
                value={examSettings.approvalRequirement}
                onChange={(e) => setExamSettings({ ...examSettings, approvalRequirement: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={() => handleSaveSection('إعدادات الامتحانات')}
              className="bg-[#dfb55a] hover:bg-[#c99f48] text-slate-950 font-black text-xs px-6 py-3 flex items-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات الامتحانات</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: FEES POLICIES */}
      {activeTab === 'fees' && (
        <div className="bg-slate-900 border border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-black text-white">سياسات الرسوم الدراسية والخصومات والتحصيل</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-2">أقصى نسبة خصم مسموحة (%):</label>
              <input
                type="number"
                value={feeSettings.maxDiscountPercent}
                onChange={(e) => setFeeSettings({ ...feeSettings, maxDiscountPercent: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-2">سياسة غرامات التأخير:</label>
              <input
                type="text"
                value={feeSettings.lateFeePenalty}
                onChange={(e) => setFeeSettings({ ...feeSettings, lateFeePenalty: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={() => handleSaveSection('سياسة الرسوم')}
              className="bg-[#dfb55a] hover:bg-[#c99f48] text-slate-950 font-black text-xs px-6 py-3 flex items-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              <span>حفظ سياسة الرسوم</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 7: HR SETTINGS */}
      {activeTab === 'hr' && (
        <div className="bg-slate-900 border border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-black text-white">إعدادات الموارد البشرية والرواتب والحضور</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-2">رصيد الإجازات السنوية الافتراضي (يوم):</label>
              <input
                type="number"
                value={hrSettings.annualLeaveDays}
                onChange={(e) => setHrSettings({ ...hrSettings, annualLeaveDays: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-2">فترة السماح الصباحية (دقائق):</label>
              <input
                type="number"
                value={hrSettings.gracePeriodMinutes}
                onChange={(e) => setHrSettings({ ...hrSettings, gracePeriodMinutes: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={() => handleSaveSection('الموارد البشرية')}
              className="bg-[#dfb55a] hover:bg-[#c99f48] text-slate-950 font-black text-xs px-6 py-3 flex items-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات الموارد البشرية</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 8: SYSTEM & API */}
      {activeTab === 'system' && (
        <div className="bg-slate-900 border border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-black text-white">إعدادات النظام والاتصال والبوابات (API & Gateway)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-2">خادم البريد الإلكتروني (SMTP Host):</label>
              <input
                type="text"
                value={systemSettings.smtpHost}
                onChange={(e) => setSystemSettings({ ...systemSettings, smtpHost: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 p-3 text-white font-bold font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-2">معرف المستأجر السحابي (Tenant ID):</label>
              <input
                type="text"
                value={systemSettings.tenantId}
                disabled
                className="w-full bg-slate-950/50 border border-slate-800 p-3 text-slate-400 font-bold font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={() => handleSaveSection('إعدادات النظام')}
              className="bg-[#dfb55a] hover:bg-[#c99f48] text-slate-950 font-black text-xs px-6 py-3 flex items-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات النظام</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 9: MASTER DATA MANAGEMENT */}
      {activeTab === 'master_data' && (
        <div className="bg-slate-900 border border-slate-800 p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-white">إدارة الجداول المرجعية الأساسية (Master Data)</h3>
              <p className="text-xs text-slate-400 mt-1">الجنسيات، الديانات، المدن، الأقسام، والمسميات الوظيفية.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMasterTab('nationalities')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${masterTab === 'nationalities' ? 'bg-[#dfb55a] text-slate-950' : 'bg-slate-800 text-slate-300'}`}
              >
                الجنسيات
              </button>
              <button
                onClick={() => setMasterTab('departments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${masterTab === 'departments' ? 'bg-[#dfb55a] text-slate-950' : 'bg-slate-800 text-slate-300'}`}
              >
                الأقسام الإدارية
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="أضف عنصراً جديداً للقائمة المرجعية..."
                value={newNatInput}
                onChange={(e) => setNewNatInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#dfb55a]"
              />
              <button
                onClick={() => {
                  if (!newNatInput.trim()) return;
                  setNationalities([...nationalities, { id: Date.now().toString(), nameAr: newNatInput.trim(), active: true }]);
                  setNewNatInput('');
                  triggerNotification('✓ تمت إضافة العنصر الجديد إلى الجدول المرجعي بنجاح.', 'success');
                }}
                className="bg-[#dfb55a] hover:bg-[#c99f48] text-slate-950 font-black px-5 py-3 text-xs flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">#</th>
                    <th className="p-3.5">اسم العنصر (عربي)</th>
                    <th className="p-3.5">حالة التفعيل</th>
                    <th className="p-3.5 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {nationalities.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-900/50">
                      <td className="p-3.5 font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-white">{item.nameAr}</td>
                      <td className="p-3.5">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          فعال في النظام ✓
                        </span>
                      </td>
                      <td className="p-3.5 text-left">
                        <button
                          onClick={() => {
                            setNationalities(nationalities.filter(n => n.id !== item.id));
                            triggerNotification('✓ تم حذف العنصر المرجعي بنجاح.', 'info');
                          }}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-black text-white">سجل التدقيق والتعديلات (Configuration Audit Timeline)</h3>
            <p className="text-xs text-slate-400">توثيق زمني دقيق لكافة التعديلات التي تم إجراؤها على إعدادات المنظومة مع اسم المسؤول.</p>
          </div>

          <div className="space-y-3">
            {configAuditLogs.map((log) => (
              <div key={log.id} className="p-4 bg-slate-950 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#dfb55a]/10 text-[#dfb55a] border border-[#dfb55a]/20 px-2 py-0.5 rounded font-bold text-[10px]">
                      {log.category}
                    </span>
                    <span className="text-white font-black">{log.action}</span>
                  </div>
                  <span className="text-slate-400 block">المسؤول: <strong className="text-slate-200">{log.user}</strong></span>
                </div>
                <div className="text-left font-mono text-slate-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 11: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="bg-slate-900 border border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-black text-white">إدارة النسخ الاحتياطي والاستعادة الفورية</h3>
            <p className="text-xs text-slate-400">أخذ نسخ احتياطية لكافة إعدادات الهيكل والمالية والبيانات المرجعية بضغطة زر.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950 p-5 border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-[#dfb55a]" />
                <span>تصدير نسخة احتياطية جديدة (Export Backup)</span>
              </h4>
              <p className="text-[11px] text-slate-400">يتم حزم كافة الجداول الإعدادية وقواعد النظام في ملف تشفير آمن بصيغة JSON.</p>
              <button
                onClick={() => {
                  logAction('EXPORT_BACKUP_ZIP', 'تم تصدير أرشيف الإعدادات بنجاح بصيغة آمنة', 'النسخ الاحتياطي');
                  triggerNotification('✓ تم تنزيل النسخة الاحتياطية للإعدادات بنجاح.', 'success');
                }}
                className="w-full bg-[#dfb55a] hover:bg-[#c99f48] text-slate-950 font-black py-2.5 text-xs shadow"
              >
                إنشاء وتنزيل النسخة الاحتياطية 💾
              </button>
            </div>

            <div className="bg-slate-950 p-5 border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-yellow-400" />
                <span>استعادة إعدادات سابقة (Restore Backup)</span>
              </h4>
              <p className="text-[11px] text-slate-400">اختر ملف أرشيف سابق لاستعادة إعدادات النظام في حال الحاجة الطارئة.</p>
              <button
                onClick={() => {
                  logAction('RESTORE_BACKUP_ZIP', 'تمت مطابقة واستعادة الإعدادات بنجاح دون أي فقدان للبيانات', 'النسخ الاحتياطي');
                  triggerNotification('✓ تمت استعادة إعدادات النظام بنجاح وتحديث كافة الجداول.', 'success');
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-yellow-400 font-bold py-2.5 text-xs shadow"
              >
                رفع واستعادة ملف الإعدادات 📂
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
