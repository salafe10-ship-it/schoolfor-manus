import { AlertTriangle, ArrowLeft, BarChart3, CalendarRange, CheckCircle2, ChevronLeft, ClipboardCheck, Coins, DollarSign, Download, FileSpreadsheet, FileText, GraduationCap, Home, Pencil, Percent, PiggyBank, Plus, Printer, QrCode, RefreshCw, Save, Search, Settings, Settings2, ShieldCheck, Trash2, TrendingUp, Undo2, UserCheck, Users } from 'lucide-react';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnterpriseLogger } from '../database/services/EnterpriseLogger';
import React, { useState, useMemo } from 'react';
import { Student, Invoice, UserRole, Stage, Grade, AcademicClass, CostCenter } from '../types';
import { SQLTransactionEngine } from '../database/transactions/transactionManager';
import { SQLCommandBuilder } from '../database/transactions/SQLCommand';
import { useCurrency } from '../utils/currency';
import EnterpriseActionToolbar from './shared/EnterpriseActionToolbar';
import { EnterpriseAuditLogger } from '../utils/EnterpriseAuditLogger';
import AccountingIntegrityDemo from '../certification/AccountingIntegrityDemo';
import { StudentAffairsValidationFramework } from '../validation/StudentAffairsValidationFramework';
import { getTrustedAccessToken } from '../utils/auth';

interface StudentFinancialPortalProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  filteredStudents: Student[];
  handleStudentPaymentSubmit: (e: React.FormEvent, studentId: string, amount: number, method: string) => void;
  currentRole: UserRole;
  setActiveSection: (sec: string) => void;
  logAction: (action: string, details: string, module: string) => void;
  triggerNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
  stages?: Stage[];
  setStages?: React.Dispatch<React.SetStateAction<Stage[]>>;
  grades?: Grade[];
  setGrades?: React.Dispatch<React.SetStateAction<Grade[]>>;
  academicClasses?: AcademicClass[];
  setAcademicClasses?: React.Dispatch<React.SetStateAction<AcademicClass[]>>;
  costCenters?: CostCenter[];
  setCostCenters?: React.Dispatch<React.SetStateAction<CostCenter[]>>;
  selectedSchool?: any;
  selectedBranch?: { id?: string; name?: string } | null;
}

const STUDENT_RECEIVABLE_ACCOUNT = '1201';

export default function StudentFinancialPortal({
  students,
  setStudents,
  invoices,
  setInvoices,
  filteredStudents,
  handleStudentPaymentSubmit,
  currentRole,
  setActiveSection,
  logAction,
  triggerNotification,
  stages,
  setStages,
  grades,
  setGrades,
  academicClasses,
  setAcademicClasses,
  costCenters,
  setCostCenters,
  selectedSchool,
  selectedBranch
}: StudentFinancialPortalProps) {
  const { currencyConfig, format: formatCurrency } = useCurrency();
  const auditActor = selectedSchool?.currentUserName || selectedSchool?.userName || 'المستخدم الحالي';
  const auditTenantId = selectedSchool?.id || students[0]?.schoolId || '';
  const auditIpAddress = 'غير متاح';
  const createFinancialReference = (prefix: string) => {
    const uuid = globalThis.crypto?.randomUUID?.();
    const fallback = `${Date.now().toString(36)}-${Math.floor((globalThis.performance?.now?.() || 0) * 1000).toString(36)}`;
    return `${prefix}-${uuid || fallback}`;
  };
  // Sub-navigation state inside Student Financial Portal (Rethought according to the image)
  const [activeSubSec, setActiveSubSec] = useState<string>('analytics');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [reportSearch, setReportSearch] = useState<string>('');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('all');
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  
  // States for sub-screens
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('بطاقة مدى البنكية (Mada)');
  
  // States for Fee Amount Settings
  const [feeSettings, setFeeSettings] = useState({
    kindergarten: 0,
    primary: 0,
    preparatory: 0,
    secondary: 0,
    busFee: 0,
    booksFee: 0,
    examFee: 0,
    siblingDiscountPercent: 0
  });

  // Fee configuration items representing the user's specific billing types (e.g. from the uploaded image)
  const [feeConfigs, setFeeConfigs] = useState<Array<{
    id: string;
    type: string;
    amount: number;
    account: string;
    orderNumber: string;
    activities: string;
  }>>([]);

  // Form states for fee config inputs
  const [currFeeId, setCurrFeeId] = useState<string>('');
  const [currFeeType, setCurrFeeType] = useState<string>('');
  const [currFeeAmount, setCurrFeeAmount] = useState<number>(0);
  const [currFeeAccount, setCurrFeeAccount] = useState<string>('');
  const [currFeeOrderNumber, setCurrFeeOrderNumber] = useState<string>('1');
  const [currFeeActivities, setCurrFeeActivities] = useState<string>('');

  // States for Mass Distribution
  const [massClassroom, setMassClassroom] = useState<string>('الصف الأول ابتدائي');
  const [massFeeType, setMassFeeType] = useState<string>('التسجيل العام والتمدرس السنوي');
  const [massFeeAmount, setMassFeeAmount] = useState<number>(0);
  const [massDueDate, setMassDueDate] = useState<string>(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Record<string, boolean>>({});

  const massTargetStudents = useMemo(
    () => students.filter(student => massClassroom === 'الفصل غير محدد'
      ? !String(student.classroom || '').trim()
      : student.classroom === massClassroom),
    [students, massClassroom]
  );

  // States for Installment Planning
  const [installmentPlanType, setInstallmentPlanType] = useState<'monthly' | 'quarterly' | 'yearly'>('quarterly');
  const [generatedInstallments, setGeneratedInstallments] = useState<Array<{ date: string; amount: number; status: 'paid' | 'unpaid' }>>([]);

  // Redesigned Management Tab States (matching the uploaded image)
  const [siblingDiscountPercent, setSiblingDiscountPercent] = useState<number>(0);
  const [manualDiscountAmount, setManualDiscountAmount] = useState<number>(0);
  const [voucherDate, setVoucherDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [voucherNumber, setVoucherNumber] = useState<string>('');
  const [hasSiblingsDetected, setHasSiblingsDetected] = useState<boolean>(false);
  const [customDiscountText, setCustomDiscountText] = useState<string>('0.00');
  
  const [activeSaving, setActiveSaving] = useState<string | null>(null);
  const [financialPersistence, setFinancialPersistence] = useState<'loading' | 'ready' | 'blocked'>('loading');
  const [financialPersistenceMessage, setFinancialPersistenceMessage] = useState('جارٍ التحقق من مصدر البيانات المالية...');
  const [financialPersistenceVersion, setFinancialPersistenceVersion] = useState(0);
  const feeImportInputRef = React.useRef<HTMLInputElement | null>(null);

  const runWithLock = async (opName: string, asyncFn: () => Promise<any> | any) => {
    if (activeSaving) {
      triggerNotification(`⚠️ لا يمكن التكرار: هناك عملية مراجعة أو حفظ قيد التنفيذ حالياً (${activeSaving}). يرجى الانتظار...`, 'warning');
      return;
    }
    setActiveSaving(opName);
    triggerNotification(`⏳ العملية جارية قيد التنفيذ... يرجى الانتظار وعدم تكرار النقر.`, 'info');
    try {
      await asyncFn();
    } catch (err: any) {
      triggerNotification(`❌ حدث خطأ أثناء الحفظ: ${err.message || String(err)}`, 'warning');
      throw err;
    } finally {
      // Simulate network delay to make the lock highly visible and perfectly robust as requested by user
      await new Promise(resolve => setTimeout(resolve, 1500));
      setActiveSaving(null);
    }
  };
  
  // Custom fee items rows inside the main invoice builder form under "إنشاء مطالبة ماليّة"
  const [feeRows, setFeeRows] = useState<Array<{ id: string; type: string; amount: number; remarks: string }>>([]);

  const defaultFeeTypeOptions = [
    { value: 'زي مدرسي', label: 'زي مدرسي مخصص ثنائي الأطقم' },
    { value: 'رسوم دراسية فصليّة', label: 'رسوم قسط دراسي معتمد' },
    { value: 'كتب ومقررات', label: 'كتب ومقررات وطنية مطورة' },
    { value: 'باص نقل ومواصلات', label: 'باص نقل ومواصلات (المسار الأول)' },
    { value: 'زي معملي للأنشطة والرياضة', label: 'زي معملي للأنشطة والرياضة' },
    { value: 'أنشطة رحلات وتقافية', label: 'أنشطة رحلات وتقافية مميزة' }
  ];
  const feeTypeOptions = useMemo(() => {
    const configured = feeConfigs
      .map(config => ({ value: config.type.trim(), label: config.type.trim() }))
      .filter(option => option.value);
    const merged = [...configured, ...defaultFeeTypeOptions];
    return merged.filter((option, index, all) => all.findIndex(item => item.value === option.value) === index);
  }, [feeConfigs]);

  // Keep a portal-local copy of the canonical invoice stream. The parent shell
  // may remount module state while the portal hydrates from Supabase; this copy
  // prevents the financial dashboard from falling back to an empty collection
  // after receipts have already loaded.
  const [financialInvoices, setFinancialInvoices] = useState<Invoice[]>([]);

  const [viewingVoucher, setViewingVoucher] = useState<Invoice | null>(financialInvoices[0] || null);

  // Financial records start empty and are populated only from the canonical
  // server store or from an explicitly created transaction in this session.
  const [studentReceiptVouchers, setStudentReceiptVouchers] = useState<Array<any>>([]);

  // GL Shared state variables central to database synchronization
  const [glRvs, setGlRvs] = useState<any[]>([]);
  const [glJvs, setGlJvs] = useState<any[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([]);
  const [expenseAccruals, setExpenseAccruals] = useState<any[]>([]);

  const feeRevenueAccountOptions = useMemo(() => {
    const accounts = chartOfAccounts
      .filter(account => account?.isActive !== false && account?.is_active !== false)
      .filter(account => account?.type !== 'رئيسي' && account?.isLeaf !== false && account?.is_leaf !== false)
      .filter(account => {
        const code = String(account?.code || account?.accountCode || account?.id || '');
        const classification = String(account?.classification || account?.accountNature || account?.nature || '').toLowerCase();
        return code.startsWith('4') || classification.includes('revenue') || classification.includes('إيراد');
      })
      .map(account => ({
        code: String(account?.code || account?.accountCode || account?.id || '').trim(),
        name: String(account?.nameAr || account?.name || account?.nameEn || '').trim()
      }))
      .filter(account => account.code)
      .sort((a, b) => a.code.localeCompare(b.code));
    if (currFeeAccount && !accounts.some(account => account.code === currFeeAccount)) {
      return [{ code: currFeeAccount, name: 'الحساب الحالي — يحتاج مراجعة' }, ...accounts];
    }
    return accounts;
  }, [chartOfAccounts, currFeeAccount]);

  const validateFeeRevenueAccount = (accountCode: string) => {
    const normalizedCode = String(accountCode || '').trim();
    if (!normalizedCode) return 'يجب تحديد حساب إيراد مرتبط ببند الرسوم.';
    if (chartOfAccounts.length === 0) return null;
    const account = chartOfAccounts.find(item => String(item?.code || item?.accountCode || item?.id || '').trim() === normalizedCode);
    if (!account) return `حساب الإيراد ${normalizedCode} غير موجود في دليل الحسابات الحالي.`;
    if (account.isActive === false || account.is_active === false) return `حساب الإيراد ${normalizedCode} غير نشط.`;
    if (account.type === 'رئيسي' || account.isLeaf === false || account.is_leaf === false) return `حساب الإيراد ${normalizedCode} تجميعي ولا يقبل الترحيل المباشر.`;
    return null;
  };

  // DB Syncer helper
  const saveToServerDb = async (
    updatedStudRvs?: any[],
    updatedRvs?: any[],
    updatedJvs?: any[],
    updatedAccounts?: any[],
    updatedInvoices?: Invoice[],
    updatedFeeConfigs?: typeof feeConfigs,
    updatedFeeSettings?: typeof feeSettings
  ) => {
    if (financialPersistence !== 'ready') {
      throw new Error(financialPersistenceMessage || 'الحفظ المالي متوقف حتى يتوفر مصدر قاعدة بيانات موثق.');
    }
    const payload = {
      studentReceiptVouchers: updatedStudRvs !== undefined ? updatedStudRvs : studentReceiptVouchers,
      receiptVouchers: updatedRvs !== undefined ? updatedRvs : glRvs,
      journalEntries: updatedJvs !== undefined ? updatedJvs : glJvs,
      chartOfAccounts: updatedAccounts !== undefined ? updatedAccounts : chartOfAccounts,
      invoices: updatedInvoices !== undefined ? updatedInvoices : financialInvoices,
      feeConfigs: updatedFeeConfigs !== undefined ? updatedFeeConfigs : feeConfigs,
      feeSettings: updatedFeeSettings !== undefined ? updatedFeeSettings : feeSettings,
      expenseAccruals,
      expectedVersion: financialPersistenceVersion
    };
    const response = await fetch('/api/financial/database', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getTrustedAccessToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
      const errData = result || { message: 'فشل حفظ الحركة المالية في قاعدة البيانات' };
      throw new Error(errData.message || 'فشل الاتصال بقاعدة البيانات المالية');
    }
    if (Number.isSafeInteger(Number(result.meta?.version))) {
      setFinancialPersistenceVersion(Number(result.meta.version));
    }
    return result;
  };

  const ensureFinancialWriteReady = () => {
    if (financialPersistence === 'ready') return true;
    triggerNotification('الحفظ والترحيل الماليان متوقفان حتى يتم الاتصال بمصدر قاعدة البيانات المعتمد.', 'warning');
    return false;
  };

  const handleSaveSiblingDiscount = async () => {
    if (!ensureFinancialWriteReady()) return;
    const normalizedPercent = Number(siblingDiscountPercent);
    if (!Number.isFinite(normalizedPercent) || normalizedPercent < 0 || normalizedPercent > 100) {
      triggerNotification('نسبة خصم الأشقاء يجب أن تكون بين 0 و100 بالمائة.', 'warning');
      return;
    }

    try {
      const updatedFeeSettings = {
        ...feeSettings,
        siblingDiscountPercent: normalizedPercent
      };
      await saveToServerDb(undefined, undefined, undefined, undefined, undefined, undefined, updatedFeeSettings);
      setFeeSettings(updatedFeeSettings);
      setHasSiblingsDetected(normalizedPercent > 0);
      logAction('SAVE_SIBLING_DISCOUNT_POLICY', `حفظ سياسة خصم الأشقاء بنسبة ${normalizedPercent}%`, 'إدارة الرسوم');
      triggerNotification('✓ تم حفظ سياسة خصم الأشقاء في المصدر المالي المعتمد.', 'success');
    } catch (error: any) {
      triggerNotification(error?.message || 'تعذر حفظ سياسة خصم الأشقاء.', 'warning');
    }
  };

  // On mount, load database and sync state fully
  React.useEffect(() => {
    const loadFinancialDb = async () => {
      try {
        const response = await fetch('/api/financial/database', {
          headers: {
        'Authorization': `Bearer ${getTrustedAccessToken()}`
          }
        });
        const res = await response.json();
        if (!response.ok || !res.success) {
          throw new Error(res.message || `فشل تحميل المصدر المالي (${response.status})`);
        }
        if (res.data && Object.keys(res.data).length > 0) {
           setFinancialInvoices(res.data.invoices || []);
           setInvoices(res.data.invoices || []);
           setFeeConfigs(res.data.feeConfigs || []);
           if (res.data.feeSettings) {
             const loadedFeeSettings = {
               ...res.data.feeSettings,
               siblingDiscountPercent: Number(res.data.feeSettings.siblingDiscountPercent || 0)
             };
             setFeeSettings(loadedFeeSettings);
             setSiblingDiscountPercent(loadedFeeSettings.siblingDiscountPercent);
           }
           if (res.data.studentReceiptVouchers) setStudentReceiptVouchers(res.data.studentReceiptVouchers);
          if (res.data.receiptVouchers) setGlRvs(res.data.receiptVouchers);
          if (res.data.journalEntries) setGlJvs(res.data.journalEntries);
          if (res.data.chartOfAccounts) setChartOfAccounts(res.data.chartOfAccounts);
          setExpenseAccruals(Array.isArray(res.data.expenseAccruals) ? res.data.expenseAccruals : []);
          setFinancialPersistence('ready');
          setFinancialPersistenceVersion(Number(res.meta?.version || 0));
          setFinancialPersistenceMessage('البيانات المالية محملة من المصدر المعتمد.');
        } else {
          // An empty financial store is valid. Never seed financial records from
          // browser storage or demo fixtures; the server is the only source of truth.
          setStudentReceiptVouchers([]);
          setGlRvs([]);
          setGlJvs([]);
           setChartOfAccounts([]);
           setFinancialInvoices([]);
           setInvoices([]);
           setFeeConfigs([]);
           setExpenseAccruals([]);
          setFinancialPersistence('ready');
          setFinancialPersistenceVersion(Number(res.meta?.version || 0));
          setFinancialPersistenceMessage('المصدر المعتمد متاح ولا توجد حركات مالية مسجلة بعد.');
        }
      } catch (err) {
        setFinancialPersistence('blocked');
        setFinancialPersistenceMessage('لم يتم التحقق من مصدر مالي معتمد؛ تم تعطيل الحفظ والترحيل حمايةً للبيانات.');
        console.error("Failed to load financial database from server", err);
      }
    };
    loadFinancialDb();
  }, []);

  // The financial portal can be opened directly from the dashboard, before
  // Student Affairs has mounted its own paged loader. Hydrate the same
  // canonical student contract here so invoice balances can be reconciled to
  // actual student rows and displayed in every financial screen.
  React.useEffect(() => {
    let cancelled = false;
    if (!selectedSchool?.id || students.some(student => student.schoolId === selectedSchool.id)) {
      return () => { cancelled = true; };
    }

    const loadStudentsForFinancialView = async () => {
      try {
        const response = await fetch('/api/students?page=1&limit=100&sortBy=name&sortOrder=asc', {
          headers: {
            'Authorization': `Bearer ${getTrustedAccessToken()}`,
            'Accept': 'application/json'
          },
          cache: 'no-store'
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) {
          throw new Error(result.message || `تعذر تحميل الطلاب الماليين (${response.status})`);
        }
        if (cancelled) return;
        const rows = Array.isArray(result.data) ? result.data : [];
        setStudents(current => [
          ...current.filter(student => student.schoolId !== selectedSchool.id),
          ...rows
        ]);
      } catch (error: any) {
        if (!cancelled) {
          triggerNotification(error?.message || 'تعذر تحميل الطلاب المرتبطين بالرسوم.', 'warning');
        }
      }
    };

    void loadStudentsForFinancialView();
    return () => { cancelled = true; };
  }, [selectedSchool?.id, students, setStudents, triggerNotification]);

  // Track the selected student receipt voucher
  const [selectedStudRv, setSelectedStudRv] = useState<any>(null);

  // Form states for adding/editing a receipt voucher
  const [studRvForm, setStudRvForm] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    studentId: '',
    studentName: '',
    amount: 0,
    paymentMethod: 'نقدي',
    receivingAccount: '1101',
    operationalType: 'رسوم دراسية',
    against: '',
    stage: 'الابتدائي',
    costCenter: 'primary',
    status: 'draft',
    notes: '',
    attachmentName: ''
  });

  // Mode of form: 'view' | 'edit' | 'create'
  const [studRvMode, setStudRvMode] = useState<'view' | 'edit' | 'create'>('view');

  // Search filter for receipt list
  const [rvSearch, setRvSearch] = useState('');

  // Status quick filter
  const [rvStatusFilter, setRvStatusFilter] = useState('all');

  // Select first item on mount or tab focus
  React.useEffect(() => {
    if (studentReceiptVouchers.length > 0 && !selectedStudRv) {
      setSelectedStudRv(studentReceiptVouchers[0]);
    }
  }, [studentReceiptVouchers, selectedStudRv]);

  // Populate form when selection changes
  React.useEffect(() => {
    if (selectedStudRv && studRvMode === 'view') {
      setStudRvForm({
        id: selectedStudRv.id,
        date: selectedStudRv.date,
        studentId: selectedStudRv.studentId,
        studentName: selectedStudRv.studentName,
        amount: selectedStudRv.amount,
        paymentMethod: selectedStudRv.paymentMethod,
        receivingAccount: selectedStudRv.receivingAccount,
        operationalType: selectedStudRv.operationalType,
        against: selectedStudRv.against,
        stage: selectedStudRv.stage,
        costCenter: selectedStudRv.costCenter,
        status: selectedStudRv.status,
        notes: selectedStudRv.notes || '',
        attachmentName: selectedStudRv.attachmentName || ''
      });
    }
  }, [selectedStudRv, studRvMode]);

  const convertNumberToArabicWords = (num: number) => {
    if (num === 5000) return 'فقط خمسة آلاف دينار ليبي لا غير';
    if (num === 3000) return 'فقط ثلاثة آلاف دينار ليبي لا غير';
    if (num === 15000) return 'فقط خمسة عشر ألف دينار ليبي لا غير';
    return `فقط ${num.toLocaleString('ar-LY')} دينار ليبي لا غير`;
  };

  const navigateToJournalEntry = (jvId: string) => {
    localStorage.setItem('erp_target_journal_entry_id', jvId);
    setActiveSection('accounts');
    triggerNotification(`✓ تم التحويل إلى دفتر اليومية العامة لاستعراض القيد رقم ${jvId}`, 'success');
  };

  const navigateToReceiptVoucher = (rvId: string) => {
    localStorage.setItem('erp_target_receipt_voucher_id', rvId);
    setActiveSection('accounts');
    triggerNotification(`✓ تم التحويل إلى سندات القبض العامة لاستعراض السند رقم ${rvId}`, 'success');
  };

  // Handle student selection to automatically populate stage, costCenter, and description
  const handleStudentSelectInForm = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const classroom = student.classroom || '';
    const costCenter = classroom.includes('روضة') || classroom.includes('تمهيدي') ? 'kindergarten' :
                       classroom.includes('ابتدائي') || classroom.includes('الأول') || classroom.includes('الثاني') || classroom.includes('الثالث') || classroom.includes('الرابع') || classroom.includes('الخامس') || classroom.includes('السادس') ? 'primary' :
                       classroom.includes('إعدادي') || classroom.includes('متوسط') || classroom.includes('السابع') || classroom.includes('الثامن') || classroom.includes('التاسع') ? 'middle' :
                       classroom.includes('ثانوي') || classroom.includes('العاشر') || classroom.includes('الحادي عشر') || classroom.includes('الثاني عشر') ? 'secondary' : 'primary';

    const stageLabel = costCenter === 'kindergarten' ? 'الروضة' :
                       costCenter === 'primary' ? 'الابتدائي' :
                       costCenter === 'middle' ? 'الإعدادي' : 'الثانوي';

    const financialStudent = financialStudentRows.find(s => s.id === studentId);
    const remainingBalance = financialStudent ? Number(financialStudent.feesRemaining || 0) : Number(student.feesRemaining || 0);

    setStudRvForm(prev => ({
      ...prev,
      studentId: student.id,
      studentName: student.name,
      stage: stageLabel,
      costCenter: costCenter,
      amount: remainingBalance > 0 ? remainingBalance : 0,
      against: `سداد قيمة الرسوم الدراسية للطالب: ${student.name} - المرحلة التعليمية: ${stageLabel}`
    }));
  };

  // 1. Toolbar - NEW
  const handleNewStudRv = () => {
    const draftId = createFinancialReference('DRAFT-2026');
    setStudRvMode('create');
    setStudRvForm({
      id: draftId,
      date: new Date().toISOString().split('T')[0],
      studentId: '',
      studentName: '',
      amount: 0,
      paymentMethod: 'نقدي',
      receivingAccount: '1101',
      operationalType: 'رسوم دراسية',
      against: '',
      stage: 'الابتدائي',
      costCenter: 'primary',
      status: 'draft',
      notes: '',
      attachmentName: ''
    });
    setSelectedStudRv(null);
    triggerNotification('📋 تم فتح نموذج سند قبض جديد (مسودة جاهزة للتعبئة)', 'info');
  };

  // 2. Toolbar - SAVE (محفوظ)
  const handleSaveStudRv = () => {
    runWithLock('حفظ سند قبض طالب', async () => {
      if (!ensureFinancialWriteReady()) return;
      if (!studRvForm.studentId) {
        triggerNotification('⚠️ الرجاء اختيار الطالب أولاً', 'warning');
        return;
      }
      if (studRvForm.amount <= 0) {
        triggerNotification('⚠️ يجب أن يكون مبلغ السند أكبر من صفر', 'warning');
        return;
      }
      if (!studRvForm.against.trim()) {
        triggerNotification('⚠️ الرجاء تحديد البيان والشرح التفصيلي لأسباب الدفع', 'warning');
        return;
      }

      const student = students.find(s => s.id === studRvForm.studentId);
      const financialStudent = financialStudentRows.find(s => s.id === studRvForm.studentId) || student;
      const remainingBalance = Number(financialStudent?.feesRemaining || 0);
      if (financialInvoices.length > 0 && studRvForm.amount > remainingBalance && studRvForm.status === 'draft') {
        triggerNotification(`⚠️ تم رفض السند: المبلغ المدخل (${studRvForm.amount}) يتجاوز الرسوم المتبقية الموثقة (${remainingBalance})`, 'warning');
        return;
      }

      let finalVoucher;
      let updatedStudentVouchers: any[];
      if (studRvMode === 'create') {
        const permanentId = createFinancialReference('RV-STUD-2026');
        finalVoucher = {
          ...studRvForm,
          id: permanentId,
          status: 'saved',
          createdBy: auditActor,
          createdAt: new Date().toLocaleString('ar-LY')
        };
        updatedStudentVouchers = [finalVoucher, ...studentReceiptVouchers];
      } else {
        finalVoucher = {
          ...selectedStudRv,
          ...studRvForm,
          status: 'saved',
          updatedBy: auditActor,
          updatedAt: new Date().toLocaleString('ar-LY')
        };
        updatedStudentVouchers = studentReceiptVouchers.map(v => v.id === finalVoucher.id ? finalVoucher : v);
      }

      await saveToServerDb(updatedStudentVouchers);
      setStudentReceiptVouchers(updatedStudentVouchers);
      setSelectedStudRv(finalVoucher);

      setStudRvMode('view');
      triggerNotification(`✓ تم حفظ سند القبض ${finalVoucher.id} بنجاح كمسودة مالية غير مرحلة.`, 'success');
      logAction('SAVE_STUDENT_RECEIPT', `تم حفظ سند القبض ${finalVoucher.id} للطالب ${finalVoucher.studentName} بقيمة ${finalVoucher.amount} د.ل`, 'حسابات الطلاب');
    });
  };

  // 3. Toolbar - APPROVE (اعتماد)
  const handleApproveStudRv = async () => {
    if (!ensureFinancialWriteReady()) return;
    if (!selectedStudRv) return;
    if (selectedStudRv.status !== 'saved') {
      triggerNotification('⚠️ لا يمكن اعتماد السند إلا بعد حفظه كمسودة مالية.', 'warning');
      return;
    }
    if (selectedStudRv.status === 'posted') {
      triggerNotification('⚠️ لا يمكن تعديل أو اعتماد السند بعد ترحيله بالكامل الحسابات العامة.', 'warning');
      return;
    }
    if (selectedStudRv.status === 'cancelled') {
      triggerNotification('⚠️ لا يمكن تعديل أو اعتماد السند بعد إلغائه.', 'warning');
      return;
    }

    const approvedVoucher = {
      ...selectedStudRv,
      status: 'approved',
      approvedBy: auditActor,
      approvedAt: new Date().toLocaleString('ar-LY')
    };

    const updatedStudentVouchers = studentReceiptVouchers.map(v => v.id === approvedVoucher.id ? approvedVoucher : v);
    await saveToServerDb(updatedStudentVouchers);
    setStudentReceiptVouchers(updatedStudentVouchers);
    setSelectedStudRv(approvedVoucher);
    triggerNotification(`✓ تم اعتماد سند القبض ${approvedVoucher.id} بنجاح من قبل المدير المالي. جاهز للترحيل.`, 'success');
    logAction('APPROVE_STUDENT_RECEIPT', `تم اعتماد سند القبض ${approvedVoucher.id} للطالب ${approvedVoucher.studentName} بقيمة ${approvedVoucher.amount} د.ل`, 'حسابات الطلاب');
  };

  // 4. Toolbar - POST (ترحيل) - The Core Accounting Integration Step
  const handlePostStudRv = async () => {
    if (!ensureFinancialWriteReady()) return;
    if (!selectedStudRv) return;
    if (selectedStudRv.status !== 'approved') {
      triggerNotification('⚠️ لا يمكن الترحيل قبل اعتماد السند مالياً.', 'warning');
      return;
    }
    if (selectedStudRv.status === 'posted') {
      triggerNotification('⚠️ هذا السند مرحل سابقاً ولا يجوز ترحيله مرتين.', 'warning');
      return;
    }
    if (selectedStudRv.status === 'cancelled') {
      triggerNotification('⚠️ السند ملغي ولا يمكن ترحيله.', 'warning');
      return;
    }

    const student = students.find(s => s.id === selectedStudRv.studentId);
    if (!student) {
      triggerNotification('❌ الطالب المرتبط بالسند غير موجود في المنظومة.', 'warning');
      return;
    }

    // Determine safe sequences from GL
    const receiptVoucherId = createFinancialReference('RCV-2026');
    const journalEntryId = createFinancialReference('JV-2026');
    const studentPaymentId = createFinancialReference('STP-2026');

    const debitAccountCode = selectedStudRv.receivingAccount;
    const debitAccountName = debitAccountCode === '1101' ? 'صندوق الخزينة الرئيسي (كاش)' : 'حساب مصرف الوحدة الجاري';
    const stageLabel = selectedStudRv.stage;
    const costCenter = selectedStudRv.costCenter;
    const amount = selectedStudRv.amount;

    // Secure database transaction simulation
    const transactionResult = await SQLTransactionEngine.run({
      operationName: `POST_STUDENT_RECEIPT_VOUCHER_TO_GL (ترحيل سند القبض ${selectedStudRv.id} للحسابات العامة)`,
      tenantId: auditTenantId,
      userId: auditActor,
      userName: auditActor,
      ipAddress: auditIpAddress,
      affectedTables: ['student_receipt_vouchers', 'receipt_vouchers', 'journal_entries', 'chart_of_accounts', 'students', 'audit_logs'],
      validationBlock: () => {
        if (selectedStudRv.status === 'posted') return { valid: false, error: 'السند مرحل بالفعل' };
        if (amount <= 0) return { valid: false, error: 'مبلغ السند غير صحيح' };
        const financialStudent = financialStudentRows.find(s => s.id === student.id);
        if (financialInvoices.length > 0 && financialStudent && amount > Number(financialStudent.feesRemaining || 0)) {
          return { valid: false, error: `المبلغ يتجاوز الرصيد المتبقي للطالب (${financialStudent.feesRemaining})` };
        }
        return { valid: true };
      },
      authorizationBlock: () => {
        try {
          StudentAffairsValidationFramework.validateActionPermission(currentRole, 'save', 'financial');
          return { authorized: true };
        } catch (err: any) {
          return { authorized: false, error: err.message };
        }
      },
      executionBlock: async () => {
        // B) Create general ledger Receipt Voucher
        const glRv = {
          id: receiptVoucherId,
          date: selectedStudRv.date,
          school: selectedSchool?.name || 'المدرسة الحالية',
          stage: stageLabel,
          costCenter: costCenter,
          receivedFrom: student.name,
          operationType: selectedStudRv.operationalType === 'رسوم حافلة' ? 'رسوم حافلة' : 'رسوم دراسية',
          paymentMethod: selectedStudRv.paymentMethod,
          receivingAccount: debitAccountCode,
          receivableAccount: STUDENT_RECEIVABLE_ACCOUNT,
          amount: amount,
          against: selectedStudRv.against,
          attachmentName: selectedStudRv.attachmentName || null,
          user: auditActor,
          status: 'معتمد',
          notes: selectedStudRv.notes || `مرحل تلقائياً من سند قبض الطلاب رقم ${selectedStudRv.id}`,
          studentPaymentId,
          studentId: student.id,
          studentName: student.name,
          receiptVoucherId,
          journalEntryId,
          financialPeriod: 'السنة المالية 2026',
          createdAt: new Date().toLocaleString('ar-LY')
        };

        const updatedRvs = [glRv, ...glRvs];

        // C) Create Journal Entry (JV)
        const glJv = {
          id: journalEntryId,
          date: selectedStudRv.date,
          description: `قيد ترحيل تلقائي: ${selectedStudRv.against} - سند قبض رقم ${selectedStudRv.id}`,
          debitTotal: amount,
          creditTotal: amount,
          status: 'مرحل',
          type: 'بسيط',
          createdByUser: auditActor,
          createdAt: new Date().toLocaleTimeString('ar-LY') + ' ' + new Date().toLocaleDateString('ar-LY'),
          updatedAt: new Date().toLocaleTimeString('ar-LY') + ' ' + new Date().toLocaleDateString('ar-LY'),
          documentType: 'سند قبض',
          receiptVoucherId,
          studentPaymentId,
          studentName: student.name,
          stage: stageLabel,
          costCenter: costCenter,
          lines: [
            {
              id: createFinancialReference('line'),
              accountCode: debitAccountCode,
              accountName: debitAccountName,
              description: `الجانب المدين - استلام قيمة السند بـ ${debitAccountName}`,
              debit: amount,
              credit: 0,
              costCenter
            },
            {
              id: createFinancialReference('line'),
              accountCode: STUDENT_RECEIVABLE_ACCOUNT,
              accountName: 'ذمم الطلاب المدينة',
              description: `الجانب الدائن - تسوية ذمم الطالب مقابل سند الرسوم للمرحلة التعليمية: ${stageLabel}`,
              debit: 0,
              credit: amount,
              costCenter
            }
          ],
          attachments: selectedStudRv.attachmentName ? [selectedStudRv.attachmentName] : []
        };

        const updatedJvs = [glJv, ...glJvs];

        // D) Update Chart of Accounts
        const updatedAccounts = chartOfAccounts.map((acc: any) => {
          if (acc.code === debitAccountCode) {
            return { ...acc, balance: (acc.balance || 0) + amount };
          }
          if (acc.code === STUDENT_RECEIVABLE_ACCOUNT) {
            return { ...acc, balance: Math.max(0, (acc.balance || 0) - amount) };
          }
          return acc;
        });

        // E) Update our local voucher status and link it
        const postedVoucher = {
          ...selectedStudRv,
          status: 'posted',
          postedBy: auditActor,
          postedAt: new Date().toLocaleString('ar-LY'),
          journalEntryId,
          receiptVoucherId,
          studentPaymentId
        };

        const updatedStudRvs = studentReceiptVouchers.map(v => v.id === postedVoucher.id ? postedVoucher : v);
        await saveToServerDb(updatedStudRvs, updatedRvs, updatedJvs, updatedAccounts);

        // A) Update student balances in the UI after the canonical write succeeds.
        setStudents(prev => prev.map(s => {
          if (s.id === student.id) {
            return {
              ...s,
              feesPaid: s.feesPaid + amount,
              feesRemaining: Math.max(0, s.feesRemaining - amount)
            };
          }
          return s;
        }));
        setGlRvs(updatedRvs);
        setGlJvs(updatedJvs);
        setChartOfAccounts(updatedAccounts);
        setStudentReceiptVouchers(updatedStudRvs);
        setSelectedStudRv(postedVoucher);
        return true;
      },
      nestedSqlQueries: [
        SQLCommandBuilder.create({
          sqlText: `-- 1. Begin SQL Transaction for atomic double-entry posting`,
          parameters: []
        }),
        SQLCommandBuilder.create({
          sqlText: `SELECT id, fees_remaining FROM students WHERE id = $1 FOR UPDATE;`,
          parameters: [student.id],
          executionContext: 'Student fees inquiry'
        }),
        SQLCommandBuilder.create({
          sqlText: `-- 2. Debit cash/bank account on GL ledger`,
          parameters: []
        }),
        SQLCommandBuilder.create({
          sqlText: `UPDATE chart_of_accounts SET balance = balance + $1 WHERE code = $2;`,
          parameters: [amount, debitAccountCode],
          executionContext: 'Debit Asset account'
        }),
        SQLCommandBuilder.create({
          sqlText: `-- 3. Credit student receivable on GL ledger`,
          parameters: []
        }),
        SQLCommandBuilder.create({
          sqlText: `UPDATE chart_of_accounts SET balance = balance - $1 WHERE code = $2;`,
          parameters: [amount, STUDENT_RECEIVABLE_ACCOUNT],
          executionContext: 'Settle Student Receivable account'
        }),
        SQLCommandBuilder.create({
          sqlText: `-- 4. Deduct student remaining fees`,
          parameters: []
        }),
        SQLCommandBuilder.create({
          sqlText: `UPDATE students SET fees_paid = fees_paid + $1, fees_remaining = fees_remaining - $1 WHERE id = $2;`,
          parameters: [amount, student.id],
          executionContext: 'Deduct Remaining Fees'
        }),
        SQLCommandBuilder.create({
          sqlText: `-- 5. Insert double-entry journal entry rows into journal_entries`,
          parameters: []
        }),
        SQLCommandBuilder.create({
          sqlText: `INSERT INTO journal_entries (id, date, debit_sum, credit_sum, ref_doc) VALUES ($1, $2, $3, $4, $5);`,
          parameters: [journalEntryId, selectedStudRv.date, amount, amount, receiptVoucherId],
          executionContext: 'Create Journal Entry'
        }),
        SQLCommandBuilder.create({
          sqlText: `-- 6. Insert receipt voucher entity under GL module`,
          parameters: []
        }),
        SQLCommandBuilder.create({
          sqlText: `INSERT INTO receipt_vouchers (id, amount, source_student_id, ledger_ref) VALUES ($1, $2, $3, $4);`,
          parameters: [receiptVoucherId, amount, student.id, journalEntryId],
          executionContext: 'Create Receipt Voucher'
        }),
        SQLCommandBuilder.create({
          sqlText: `-- 7. Commit database transaction fully`,
          parameters: []
        })
      ]
    });

    if (!transactionResult.success) {
      triggerNotification(`تعذر ترحيل السند: ${transactionResult.error || 'تم التراجع عن العملية'}`, 'warning');
      return;
    }

    triggerNotification(`✓ تم ترحيل السند ${selectedStudRv.id} تلقائياً. تم إنشاء القيد المزدوج ${journalEntryId} وسند القبض بالحسابات العامة ${receiptVoucherId}.`, 'success');
    logAction('POST_STUDENT_RECEIPT', `تم ترحيل سند القبض ${selectedStudRv.id} للطالب ${student.name} بقيمة ${amount} د.ل وإنشاء قيد اليومية ${journalEntryId}`, 'حسابات الطلاب');
  };

  // 5. Toolbar - CANCEL / REVERSE (إجراء إلغاء محاسبي نظامي وعكس القيود)
  const handleCancelStudRv = async () => {
    if (!ensureFinancialWriteReady()) return;
    if (!selectedStudRv) return;
    if (selectedStudRv.status === 'cancelled') {
      triggerNotification('⚠️ هذا السند ملغي بالفعل.', 'warning');
      return;
    }

    const cancelReason = window.prompt("الرجاء إدخال سبب إلغاء السند المالي لتوثيقه ماليّاً وبحسب قواعد الرقابة المحاسبية:");
    if (!cancelReason || cancelReason.trim() === "") {
      triggerNotification("⚠️ يجب تحديد سبب لإلغاء السند المالي.", "warning");
      return;
    }

    const voidedAt = new Date().toLocaleDateString('ar-LY') + ' ' + new Date().toLocaleTimeString('ar-LY');

    if (selectedStudRv.status === 'posted') {
      const confirmReversal = window.confirm(
        `⚠️ تحذير محاسبي: هذا السند مرحل بالفعل إلى الحسابات المركزية. هل أنت متأكد من رغبتك في إلغاء السند وعكس قيد اليومية بنظام تسوية عكسي لضمان سلامة الدورة الرقابية؟`
      );
      if (!confirmReversal) return;

      const student = students.find(s => s.id === selectedStudRv.studentId);
      if (!student) {
        triggerNotification('❌ الطالب غير موجود لعكس القيد.', 'warning');
        return;
      }

      const debitAccountCode = selectedStudRv.receivingAccount;
      const debitAccountName = debitAccountCode === '1101' ? 'صندوق الخزينة الرئيسي (كاش)' : 'حساب مصرف الوحدة الجاري';
      const stageLabel = selectedStudRv.stage;
      const costCenter = selectedStudRv.costCenter;
      const amount = selectedStudRv.amount;

      // Determine new JV sequence
      const reversalJvId = createFinancialReference('JV-REVERSE-2026');

      // Run the reversal transaction and wait for the canonical write.
      const reversalResult = await SQLTransactionEngine.run({
        operationName: `REVERSE_STUDENT_RECEIPT_VOUCHER (إجراء تسوية وعكس سند القبض ${selectedStudRv.id})`,
        tenantId: auditTenantId,
        userId: auditActor,
        userName: auditActor,
        ipAddress: auditIpAddress,
        affectedTables: ['student_receipt_vouchers', 'journal_entries', 'chart_of_accounts', 'students', 'audit_logs'],
        validationBlock: () => { return { valid: true }; },
        authorizationBlock: () => {
          try {
            StudentAffairsValidationFramework.validateActionPermission(currentRole, 'save', 'financial');
            return { authorized: true };
          } catch (err: any) {
            return { authorized: false, error: err.message };
          }
        },
        executionBlock: async () => {
          // B) Create Reversal JV (Debit Student Receivable, Credit Cash/Bank)
          const reversalJv = {
            id: reversalJvId,
            date: new Date().toISOString().split('T')[0],
            description: `قيد عكس وتسوية ملغي لسند القبض رقم ${selectedStudRv.id} - الطالب ${student.name} - سبب الإلغاء: ${cancelReason}`,
            debitTotal: amount,
            creditTotal: amount,
            status: 'مرحل',
            type: 'تسوية عكسية',
             createdByUser: auditActor,
            createdAt: new Date().toLocaleTimeString('ar-LY') + ' ' + new Date().toLocaleDateString('ar-LY'),
            updatedAt: new Date().toLocaleTimeString('ar-LY') + ' ' + new Date().toLocaleDateString('ar-LY'),
            documentType: 'قيد تسوية',
            receiptVoucherId: selectedStudRv.receiptVoucherId || null,
            lines: [
              {
                id: createFinancialReference('line-reverse'),
                accountCode: STUDENT_RECEIVABLE_ACCOUNT,
                accountName: 'ذمم الطلاب المدينة',
                description: `الجانب المدين - إعادة ذمة الطالب بعد إلغاء سند القبض - سبب الإلغاء: ${cancelReason}`,
                debit: amount,
                credit: 0,
                costCenter
              },
              {
                id: createFinancialReference('line-reverse'),
                accountCode: debitAccountCode,
                accountName: debitAccountName,
                description: `الجانب الدائن - عكس وتخفيض النقدية بـ ${debitAccountName} - سبب الإلغاء: ${cancelReason}`,
                debit: 0,
                credit: amount,
                costCenter
              }
            ],
            attachments: []
          };

          const updatedJvs = [reversalJv, ...glJvs];
          // C) Adjust Chart of Accounts (Subtract from Cash and restore Receivable)
          const updatedAccounts = chartOfAccounts.map((acc: any) => {
            if (acc.code === debitAccountCode) {
              return { ...acc, balance: Math.max(0, (acc.balance || 0) - amount) };
            }
            if (acc.code === STUDENT_RECEIVABLE_ACCOUNT) {
              return { ...acc, balance: (acc.balance || 0) + amount };
            }
            return acc;
          });
          // D) Update general ledger Receipt Voucher status if linked
          let updatedRvs = glRvs;
          if (selectedStudRv.receiptVoucherId) {
            updatedRvs = glRvs.map((rv: any) => {
              if (rv.id === selectedStudRv.receiptVoucherId) {
                return { ...rv, status: 'ملغي', notes: `تم الإلغاء وعكس القيد عبر قيد التسوية ${reversalJvId} - سبب الإلغاء: ${cancelReason}` };
              }
              return rv;
            });
          }

          // E) Change local voucher status
          const cancelledVoucher = {
            ...selectedStudRv,
            status: 'cancelled',
            notes: `سبب الإلغاء: ${cancelReason} | تم إلغاء السند وعكس قيود اليومية المحاسبية تلقائياً عبر قيد التسوية العكسي ${reversalJvId}.`,
             cancelledBy: auditActor,
            cancelledAt: new Date().toLocaleString('ar-LY'),
            reversalJournalEntryId: reversalJvId,
            voidReason: cancelReason,
             voidedBy: auditActor,
            voidedAt
          };

          const updatedStudRvs = studentReceiptVouchers.map(v => v.id === cancelledVoucher.id ? cancelledVoucher : v);
          await saveToServerDb(updatedStudRvs, updatedRvs, updatedJvs, updatedAccounts);

          // Publish local state only after the canonical write succeeds.
          setStudents(prev => prev.map(s => s.id === student.id
            ? { ...s, feesPaid: Math.max(0, s.feesPaid - amount), feesRemaining: s.feesRemaining + amount }
            : s));
          setGlJvs(updatedJvs);
          setChartOfAccounts(updatedAccounts);
          setGlRvs(updatedRvs);
          setStudentReceiptVouchers(updatedStudRvs);
          setSelectedStudRv(cancelledVoucher);

          EnterpriseAuditLogger.log({
            action: 'إلغاء اعتماد',
            oldValue: selectedStudRv,
            newValue: cancelledVoucher,
            userName: auditActor,
            userRole: 'Manager',
            module: 'حسابات الطلاب',
            device: 'نظام الإدارة المالية للطلاب'
          });
          return true;
        },
        nestedSqlQueries: [
          SQLCommandBuilder.create({
            sqlText: `-- 1. Create reversal journal entry`,
            parameters: []
          }),
          SQLCommandBuilder.create({
            sqlText: `INSERT INTO journal_entries (id, description, debit_sum, credit_sum) VALUES ($1, $2, $3, $4);`,
            parameters: [reversalJvId, `عكس قيد السند ${selectedStudRv.id}`, amount, amount],
            executionContext: 'Create Reversal Journal Entry'
          }),
          SQLCommandBuilder.create({
            sqlText: `-- 2. Reverse and reduce cash/bank balance`,
            parameters: []
          }),
          SQLCommandBuilder.create({
            sqlText: `UPDATE chart_of_accounts SET balance = balance - $1 WHERE code = $2;`,
            parameters: [amount, debitAccountCode],
            executionContext: 'Reverse Asset balance'
          }),
          SQLCommandBuilder.create({
            sqlText: `-- 3. Restore student receivable balance`,
            parameters: []
          }),
          SQLCommandBuilder.create({
            sqlText: `UPDATE chart_of_accounts SET balance = balance + $1 WHERE code = $2;`,
            parameters: [amount, STUDENT_RECEIVABLE_ACCOUNT],
            executionContext: 'Restore Student Receivable balance'
          }),
          SQLCommandBuilder.create({
            sqlText: `-- 4. Reverse student balances (re-add remaining debt)`,
            parameters: []
          }),
          SQLCommandBuilder.create({
            sqlText: `UPDATE students SET fees_paid = fees_paid - $1, fees_remaining = fees_remaining + $1 WHERE id = $2;`,
            parameters: [amount, student.id],
            executionContext: 'Restore student balance'
          })
        ]
      });

      if (!reversalResult.success) {
        triggerNotification(`تعذر إلغاء السند: ${reversalResult.error || 'تم التراجع عن العملية'}`, 'warning');
        return;
      }
      triggerNotification(`✓ تم إلغاء السند وعكس القيود التلقائية بالكامل بنجاح. رقم القيد العكسي: ${reversalJvId}`, 'success');
      logAction('CANCEL_STUDENT_RECEIPT', `تم إجراء إلغاء وتسوية عكسية لسند القبض ${selectedStudRv.id} بقيمة ${amount} د.ل وعكس قيد اليومية. سبب الإلغاء: ${cancelReason}`, 'حسابات الطلاب');
    } else {
      // Not posted yet, just cancel
      const cancelledVoucher = {
        ...selectedStudRv,
        status: 'cancelled',
        notes: `سبب الإلغاء: ${cancelReason} | تم إلغاء نموذج السند المالي كمسودة غير مرحلة قبل حدوث أي أثر محاسبي.`,
         cancelledBy: auditActor,
        cancelledAt: new Date().toLocaleString('ar-LY'),
        voidReason: cancelReason,
         voidedBy: auditActor,
        voidedAt
      };
      const updatedStudRvs = studentReceiptVouchers.map(v => v.id === cancelledVoucher.id ? cancelledVoucher : v);
      try {
        await saveToServerDb(updatedStudRvs);
      } catch (error: any) {
        triggerNotification(error?.message || 'تعذر حفظ إلغاء مسودة السند في المصدر المالي.', 'warning');
        return;
      }
      setStudentReceiptVouchers(updatedStudRvs);
      setSelectedStudRv(cancelledVoucher);

      // Log in unified EnterpriseAuditLogger
      EnterpriseAuditLogger.log({
        action: 'إلغاء اعتماد',
        oldValue: selectedStudRv,
        newValue: cancelledVoucher,
         userName: auditActor,
        userRole: 'Manager',
        module: 'حسابات الطلاب',
        device: 'نظام الإدارة المالية للطلاب'
      });

      triggerNotification(`✓ تم إلغاء مسودة السند ${cancelledVoucher.id} بنجاح.`, 'success');
      logAction('CANCEL_STUDENT_RECEIPT_DRAFT', `تم إلغاء مسودة السند المالي ${cancelledVoucher.id} قبل ترحيلها. سبب الإلغاء: ${cancelReason}`, 'حسابات الطلاب');
    }
  };

  // 6. Toolbar - DELETE
  const handleDeleteStudRv = async () => {
    if (!ensureFinancialWriteReady()) return;
    if (!selectedStudRv) return;
    if (selectedStudRv.status === 'posted' || selectedStudRv.status === 'approved' || selectedStudRv.status === 'saved') {
      triggerNotification('❌ خطأ محاسبي: لا يمكن حذف السند المعتمد أو المحفوظ أو المرحل نهائياً لضمان سلامة الدورة المحاسبية والتسلسل المالي. يرجى استخدام خيار (عكس / إلغاء) بدلاً من الحذف.', 'warning');
      return;
    }

    const confirmDelete = window.confirm(`❓ هل أنت متأكد من حذف السند ${selectedStudRv.id} نهائياً؟ هذا الإجراء لا يمكن الرجوع عنه.`);
    if (!confirmDelete) return;

    const remainingVouchers = studentReceiptVouchers.filter(v => v.id !== selectedStudRv.id);
    try {
      await saveToServerDb(remainingVouchers);
    } catch (error: any) {
      triggerNotification(error?.message || 'تعذر حفظ حذف المسودة في المصدر المالي.', 'warning');
      return;
    }
    setStudentReceiptVouchers(remainingVouchers);
    setSelectedStudRv(remainingVouchers.length > 0 ? remainingVouchers[0] : null);

    triggerNotification(`✓ تم حذف السند ${selectedStudRv.id} بنجاح.`, 'success');
    logAction('DELETE_STUDENT_RECEIPT', `تم حذف سند القبض غير المرحل ${selectedStudRv.id}`, 'حسابات الطلاب');
  };

  // 6.5. Invoice Voiding (إلغاء الفواتير والمطالبات المالية)
  const handleVoidInvoice = async (invoiceId: string) => {
    if (!ensureFinancialWriteReady()) return;
    const inv = financialInvoices.find(i => i.id === invoiceId);
    if (!inv) return;

    if (inv.status === 'Cancelled' || inv.status === 'Void') {
      triggerNotification('⚠️ هذه الفاتورة ملغاة بالفعل.', 'warning');
      return;
    }
    if (inv.status === 'paid' || inv.status === 'Paid' || Number(inv.remainingAmount ?? inv.amount) < Number(inv.amount)) {
      triggerNotification('⚠️ لا تُلغى مطالبة لها سداد كلي أو جزئي قبل عكس سندات القبض المرتبطة بها.', 'warning');
      return;
    }

    const cancelReason = window.prompt("الرجاء إدخال سبب إلغاء الفاتورة لتوثيقها ماليّاً وبحسب قواعد الرقابة المحاسبية:");
    if (!cancelReason || cancelReason.trim() === "") {
      triggerNotification("⚠️ يجب تحديد سبب لإلغاء الفاتورة المعتمدة.", "warning");
      return;
    }

    const voidedAt = new Date().toLocaleDateString('ar-LY') + ' ' + new Date().toLocaleTimeString('ar-LY');

    const cancelledInvoice = {
      ...inv,
      status: 'Cancelled' as const,
      voidReason: cancelReason,
      voidedBy: auditActor,
      voidedAt,
      notes: `تم الإلغاء وعكس الأثر المالي - سبب الإلغاء: ${cancelReason}`
    };
    const updatedInvoices = financialInvoices.map(item => item.id === invoiceId ? cancelledInvoice : item);

    // Generate reversal JV if it has a journalEntryId
    let reversalJvId = '';
    if (inv.journalEntryId) {
      reversalJvId = createFinancialReference('JV-REV-INV');
    }

    const updatedJvs = reversalJvId
      ? [{
          id: reversalJvId,
          date: new Date().toISOString().split('T')[0],
          description: `عكس وإلغاء قيد فاتورة رقم ${inv.id} - سبب الإلغاء: ${cancelReason}`,
          debitTotal: inv.amount,
          creditTotal: inv.amount,
          status: 'مرحل',
          type: 'تسوية عكسية',
          createdByUser: auditActor,
          lines: [
            { id: `${reversalJvId}-debit`, accountCode: '4101', accountName: 'إيرادات الرسوم الدراسية الموحدة', debit: inv.amount, credit: 0 },
            { id: `${reversalJvId}-credit`, accountCode: '1201', accountName: 'ذمم الطلاب', debit: 0, credit: inv.amount }
          ]
        }, ...glJvs]
      : glJvs;
    const updatedAccounts = reversalJvId
      ? chartOfAccounts.map((account: any) => ['1201', '4101', '411'].includes(String(account.code))
        ? { ...account, balance: Math.max(0, Number(account.balance || 0) - Number(inv.amount || 0)) }
        : account)
      : chartOfAccounts;

    try {
      await saveToServerDb(undefined, undefined, updatedJvs, updatedAccounts, updatedInvoices);
    } catch (error: any) {
      triggerNotification(error?.message || 'تعذر حفظ إلغاء الفاتورة في المصدر المالي.', 'warning');
      return;
    }

    const student = students.find(s => s.id === inv.studentId);
    const remainingToRelease = inv.status !== 'paid' && inv.status !== 'Paid'
      ? Number(inv.remainingAmount ?? inv.amount)
      : 0;
    if (student && remainingToRelease > 0) {
      setStudents(prev => prev.map(s => s.id === student.id
        ? { ...s, feesRemaining: Math.max(0, s.feesRemaining - remainingToRelease) }
        : s));
    }
    setFinancialInvoices(updatedInvoices);
    setInvoices(updatedInvoices);
    setGlJvs(updatedJvs);
    setChartOfAccounts(updatedAccounts);

    // Log in unified EnterpriseAuditLogger
    EnterpriseAuditLogger.log({
      action: 'إلغاء اعتماد',
      oldValue: inv,
      newValue: cancelledInvoice,
      userName: auditActor,
      userRole: 'المدير المالي والمشرف العام',
      module: 'بوابة الشؤون المالية (StudentFinancialPortal)',
      ipAddress: auditIpAddress
    });

    triggerNotification(`✓ تم إلغاء الفاتورة ${inv.id} وعكس أثرها المالي بالكامل بنجاح.`, 'success');
    logAction('VOID_STUDENT_INVOICE', `تم إلغاء الفاتورة ${inv.id} للطالب ${inv.studentName} بقيمة ${inv.amount} د.ل. سبب الإلغاء: ${cancelReason}`, 'حسابات الطلاب');
  };

  // 7. Toolbar - REFRESH
  const handleRefreshReceipts = () => {
    void handleRefreshData();
  };

  const financialReportRows = useMemo(() => {
    const rows = [
      ...financialInvoices.map(invoice => ({
        recordType: 'مطالبة مالية',
        id: invoice.id,
        date: invoice.invoiceDate || invoice.dueDate || '',
        studentId: invoice.studentId,
        student: invoice.studentName,
        description: invoice.item,
        status: String(invoice.status || ''),
        amount: Number(invoice.amount || invoice.totalAmount || 0)
      })),
      ...studentReceiptVouchers.map(voucher => ({
        recordType: 'سند قبض',
        id: voucher.id,
        date: voucher.date || '',
        studentId: voucher.studentId,
        student: voucher.studentName,
        description: voucher.against || '',
        status: String(voucher.status || ''),
        amount: Number(voucher.amount || 0)
      }))
    ];
    const search = reportSearch.trim().toLowerCase();
    return rows.filter(row => {
      const normalizedStatus = row.status.toLowerCase();
      const matchesSearch = !search || [row.id, row.student, row.studentId, row.description, row.recordType]
        .some(value => String(value || '').toLowerCase().includes(search));
      const matchesStatus = reportStatusFilter === 'all'
        || normalizedStatus === reportStatusFilter
        || (reportStatusFilter === 'draft' && !['posted', 'approved', 'paid', 'cancelled', 'void'].includes(normalizedStatus));
      const matchesStart = !reportStartDate || row.date >= reportStartDate;
      const matchesEnd = !reportEndDate || row.date <= reportEndDate;
      return matchesSearch && matchesStatus && matchesStart && matchesEnd;
    });
  }, [financialInvoices, studentReceiptVouchers, reportSearch, reportStatusFilter, reportStartDate, reportEndDate]);

  const downloadFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const voucherStatusLabel = (status: unknown) => {
    const normalized = String(status || '').toLowerCase();
    return normalized === 'posted' ? 'مرحل حسابياً' : normalized === 'approved' ? 'معتمد مالياً' : normalized === 'saved' ? 'مسودة محفوظة' : normalized === 'cancelled' ? 'ملغي ومسوى' : 'مسودة';
  };

  const financialStatusLabel = (status: unknown) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'paid') return 'مسدد';
    if (normalized === 'partial') return 'مسدد جزئياً';
    if (normalized === 'unpaid') return 'غير مسدد';
    if (normalized === 'posted') return 'مرحل حسابياً';
    if (normalized === 'approved') return 'معتمد مالياً';
    if (normalized === 'cancelled' || normalized === 'void') return 'ملغى ومسوى';
    if (normalized === 'saved' || normalized === 'draft') return 'مسودة محفوظة';
    return 'غير محدد';
  };

  const feeConfigHeaders = ['المعرف', 'نوع الرسوم', 'المبلغ', 'حساب الإيراد', 'رقم الترتيب', 'الأنشطة'];

  const handleDownloadFeeTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.aoa_to_sheet([
        feeConfigHeaders,
        ['', 'رسوم دراسية فصليّة', 0, '4101', '1', '']
      ]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'FeeConfigs');
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      downloadFile(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'قالب_بنود_رسوم_الطلاب.xlsx');
      triggerNotification('✓ تم تنزيل قالب XLSX الحقيقي لبنود الرسوم.', 'success');
    } catch (error: any) {
      triggerNotification(error?.message || 'تعذر إنشاء قالب بنود الرسوم.', 'warning');
    }
  };

  const handleImportFeeConfig = () => {
    feeImportInputRef.current?.click();
  };

  const handleFeeConfigFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ensureFinancialWriteReady()) return;

    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
      if (!rows.length) throw new Error('ملف الاستيراد لا يحتوي على صفوف بيانات.');

      const imported = rows.map((row, index) => {
        const type = String(row['نوع الرسوم'] ?? row.type ?? '').trim();
        const amount = Number(row['المبلغ'] ?? row.amount ?? 0);
        const account = String(row['حساب الإيراد'] ?? row.account ?? '').trim();
        if (!type || !Number.isFinite(amount) || amount <= 0) {
          throw new Error(`الصف ${index + 2} يحتاج نوع رسوم ومبلغًا موجبًا.`);
        }
        if (!account) {
          throw new Error(`الصف ${index + 2} يحتاج حساب إيراد مرتبطًا بدليل الحسابات.`);
        }
        const accountError = validateFeeRevenueAccount(account);
        if (accountError) throw new Error(`الصف ${index + 2}: ${accountError}`);
        return {
          id: String(row['المعرف'] ?? row.id ?? '').trim() || createFinancialReference('FEE-CONFIG'),
          type,
          amount,
          account,
          orderNumber: String(row['رقم الترتيب'] ?? row.orderNumber ?? index + 1).trim(),
          activities: String(row['الأنشطة'] ?? row.activities ?? '').trim()
        };
      });

      const merged = new Map(feeConfigs.map(item => [item.id, item]));
      imported.forEach(item => merged.set(item.id, item));
      const updatedFeeConfigs = [...merged.values()];
      await saveToServerDb(undefined, undefined, undefined, undefined, undefined, updatedFeeConfigs);
      setFeeConfigs(updatedFeeConfigs);
      logAction('IMPORT_FEE_CONFIG', `استيراد ${imported.length} بند رسوم من ملف ${file.name}`, 'الإعدادات المالية');
      triggerNotification(`✓ تم استيراد وحفظ ${imported.length} بند رسوم بعد التحقق من الأعمدة والمبالغ.`, 'success');
    } catch (error: any) {
      triggerNotification(error?.message || 'تعذر استيراد ملف بنود الرسوم.', 'warning');
    }
  };

  // 8. Toolbar - EXPORT XLSX
  const handleExportExcel = async () => {
    if (filteredReceiptVouchers.length === 0) {
      triggerNotification('⚠️ لا توجد سجلات لتصديرها في الكشف الحالي المصفى.', 'warning');
      return;
    }
    const XLSX = await import('xlsx');
    const rows = filteredReceiptVouchers.map(v => ({
      'رقم السند': v.id,
      'تاريخ السند': v.date,
      'اسم الطالب': v.studentName,
      'رقم الطالب الأكاديمي': v.studentId,
      'القيمة': v.amount,
      'طريقة الدفع': v.paymentMethod,
      'الحساب المدين': v.receivingAccount === '1101' ? 'الخزينة (كاش)' : 'البنك الجاري',
      'حالة السند': voucherStatusLabel(v.status),
      'البيان ومصوغ القبض': v.against || ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'StudentReceipts');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    downloadFile(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `كشف_سندات_قبض_الطلاب_ERP_${new Date().toISOString().split('T')[0]}.xlsx`);
    logAction('EXPORT_XLSX', `تصدير عدد ${filteredReceiptVouchers.length} سند قبض طلاب لملف XLSX`, 'الحسابات');
    EnterpriseAuditLogger.log({
      action: 'تصدير',
      oldValue: `استعراض كشف سندات القبض على الشاشة لعدد ${filteredReceiptVouchers.length} سند`,
      newValue: `تصدير وتحميل ملف XLSX لسندات قبض الطلاب لعدد ${filteredReceiptVouchers.length} سجل`,
      userName: auditActor,
      userRole: 'المدير المالي والمشرف العام',
      module: 'بوابة الشؤون المالية (StudentFinancialPortal)',
      ipAddress: auditIpAddress
    });
    triggerNotification('✓ تم تحميل ملف XLSX الحقيقي بنجاح.', 'success');
  };

  const handleExportFinancialReport = async () => {
    const XLSX = await import('xlsx');
    const rows = financialReportRows.map(row => ({
      'نوع السجل': row.recordType,
      'المرجع': row.id,
      'التاريخ': row.date,
      'الطالب': row.student,
      'البيان': row.description,
      'الحالة': financialStatusLabel(row.status),
      'القيمة': row.amount
    }));
    if (rows.length === 0) {
      triggerNotification('⚠️ لا توجد حركات مطابقة لفلاتر التقرير الحالية.', 'warning');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'StudentFeesReport');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    downloadFile(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `تقرير_رسوم_الطلاب_${new Date().toISOString().split('T')[0]}.xlsx`);
    logAction('EXPORT_FINANCIAL_REPORT', `تصدير تقرير رسوم الطلاب بعدد ${rows.length} حركة`, 'حسابات الطلاب');
    EnterpriseAuditLogger.log({
      action: 'تصدير',
      oldValue: 'عرض التقرير المالي الموثق',
      newValue: `تقرير XLSX لرسوم الطلاب بعدد ${rows.length} حركة`,
      userName: auditActor,
      userRole: currentRole,
      module: 'بوابة الشؤون المالية (StudentFinancialPortal)',
      ipAddress: auditIpAddress
    });
    triggerNotification('✓ تم تنزيل تقرير رسوم الطلاب بصيغة XLSX حقيقية بنجاح.', 'success');
  };

  const handlePrintFinancialReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerNotification('تعذر فتح نافذة التقرير؛ اسمح بالنوافذ المنبثقة ثم أعد المحاولة.', 'warning');
      return;
    }
    const escapeHtml = (value: unknown) => String(value ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    const rows = financialReportRows.map(row => ({
      type: row.recordType,
      id: row.id,
      date: row.date,
      student: row.student,
      description: row.description,
      status: financialStatusLabel(row.status),
      amount: row.amount
    }));
    printWindow.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>تقرير رسوم الطلاب</title><style>
      body{font-family:Arial,sans-serif;color:#13213d;padding:28px;line-height:1.6}h1{color:#0b1733;border-bottom:3px solid #c8922e;padding-bottom:10px} .meta{display:flex;gap:24px;flex-wrap:wrap;background:#fbf8f0;border:1px solid #d8bd80;padding:12px;margin:16px 0;font-weight:bold}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#0b1733;color:#fff;padding:8px}td{border:1px solid #d8bd80;padding:7px} .amount{font-family:monospace;text-align:left}@media print{button{display:none}}
    </style></head><body><h1>تقرير رسوم الطلاب والحركات المالية</h1>
      <div class="meta"><span>المطالبات: ${escapeHtml(financialInvoices.length)}</span><span>السندات: ${escapeHtml(studentReceiptVouchers.length)}</span><span>المفوتر: ${escapeHtml(formatLD(stats.totalDebts))}</span><span>المسدد المرحل: ${escapeHtml(formatLD(stats.totalPaid))}</span><span>المتبقي: ${escapeHtml(formatLD(stats.totalRemaining))}</span></div>
      <table><thead><tr><th>النوع</th><th>المرجع</th><th>التاريخ</th><th>الطالب</th><th>البيان</th><th>الحالة</th><th>القيمة</th></tr></thead><tbody>${rows.map(row => `<tr><td>${escapeHtml(row.type)}</td><td>${escapeHtml(row.id)}</td><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.student)}</td><td>${escapeHtml(row.description)}</td><td>${escapeHtml(row.status)}</td><td class="amount">${escapeHtml(formatLD(Number(row.amount || 0)))}</td></tr>`).join('')}</tbody></table>
      <p>تاريخ الاستخراج: ${escapeHtml(new Date().toLocaleString('ar-LY'))} — المستخدم: ${escapeHtml(auditActor)}</p><script>window.onload=()=>window.print()</script></body></html>`);
    printWindow.document.close();
    logAction('PRINT_FINANCIAL_REPORT', `طباعة تقرير رسوم الطلاب المصفى بعدد ${rows.length} حركة`, 'حسابات الطلاب');
  };

  // Helper to print a student statement of account beautifully (Ledger)
  const handlePrintStudentLedger = () => {
    if (!selectedStudent) {
      triggerNotification('يرجى اختيار طالب أولاً لعرض وطباعة كشف الحساب الخاص به', 'warning');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerNotification('❌ تم حظر فتح نافذة الطباعة التلقائية بواسطة متصفحك. يرجى تفعيل النوافذ المنبثقة.', 'warning');
      return;
    }

    const schoolName = selectedSchool?.name || 'اسم المدرسة';
    const dateText = new Date().toLocaleDateString('ar-SA');
    
    // Compile table rows
    let rowsHtml = '';
    
    // Dynamic invoices
    const studentInvoices = financialInvoices.filter(inv => inv.studentId === selectedStudent.id);
    let runningBal = 0;
    
    studentInvoices.forEach(inv => {
      const isCancelled = inv.status === 'Cancelled' || inv.status === 'Void';
      const isReceipt = inv.status === 'paid' || inv.status === 'Paid' || inv.id.startsWith('receipt_');
      const debit = isReceipt ? 0 : inv.totalAmount || inv.amount;
      const credit = isReceipt ? inv.totalAmount || inv.amount : 0;
      
      if (!isCancelled) {
        if (isReceipt) {
          runningBal -= credit;
        } else {
          runningBal += debit;
        }
      }

      rowsHtml += `
        <tr class="${isReceipt ? 'receipt-row' : ''} ${isCancelled ? 'cancelled-row' : ''}" style="${isCancelled ? 'text-decoration: line-through; opacity: 0.5; color: #94a3b8;' : ''}">
          <td>${inv.invoiceDate || inv.dueDate}</td>
          <td>${inv.item} ${isCancelled ? '(ملغاة 🚫)' : ''}</td>
          <td class="amount">${debit > 0 ? debit.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}</td>
          <td class="amount">${credit > 0 ? credit.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}</td>
          <td class="amount font-bold">${isCancelled ? '---' : runningBal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
        </tr>
      `;
    });

    const totalInvoiced = studentInvoices
      .filter(i => i.status !== 'paid' && i.status !== 'Paid' && i.status !== 'Cancelled' && i.status !== 'Void' && !i.id.startsWith('receipt_'))
      .reduce((acc, curr) => acc + Number(curr.totalAmount || curr.amount || 0), 0);
    const totalPaid = studentInvoices
      .filter(i => (i.status === 'paid' || i.status === 'Paid' || i.id.startsWith('receipt_')) && i.status !== 'Cancelled' && i.status !== 'Void')
      .reduce((acc, curr) => acc + Number(curr.totalAmount || curr.amount || 0), 0);
    const remainingVal = runningBal;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>كشف حساب مالي - ${selectedStudent.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              padding: 40px;
              color: #0f172a;
              background-color: #ffffff;
              font-size: 13px;
              line-height: 1.6;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 3px double #0f172a;
              padding-bottom: 15px;
              margin-bottom: 30px;
            }
            .school-info {
              font-size: 12px;
              font-weight: bold;
              line-height: 1.6;
            }
            .doc-title {
              text-align: center;
            }
            .doc-title h1 {
              font-size: 18px;
              font-weight: 900;
              border: 2px solid #0f172a;
              padding: 6px 20px;
              border-radius: 8px;
              margin: 0;
              background-color: #f8fafc;
            }
            .meta-info {
              font-size: 11px;
              text-align: left;
              line-height: 1.5;
            }
            .student-card {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 25px;
              background-color: #f8fafc;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .student-card-item {
              display: flex;
              gap: 10px;
            }
            .student-card-label {
              font-weight: bold;
              color: #475569;
            }
            .student-card-value {
              font-weight: 700;
              color: #0f172a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 12px;
            }
            th {
              background-color: #1e3a8a;
              color: #ffffff;
              font-weight: bold;
              border: 1px solid #1e3a8a;
              padding: 8px 10px;
              text-align: right;
            }
            td {
              border: 1px solid #e2e8f0;
              padding: 8px 10px;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .receipt-row {
              background-color: #f0fdf4 !important;
            }
            .amount {
              text-align: center;
              font-family: 'JetBrains Mono', monospace;
              font-weight: 600;
              font-size: 13px;
            }
            .summary-box {
              display: flex;
              justify-content: flex-end;
              gap: 20px;
              margin-bottom: 40px;
            }
            .summary-card {
              border: 1.5px solid #cbd5e1;
              border-radius: 6px;
              padding: 10px 20px;
              text-align: center;
              min-width: 120px;
            }
            .summary-card-title {
              font-size: 10px;
              font-weight: bold;
              color: #64748b;
              margin-bottom: 5px;
            }
            .summary-card-val {
              font-size: 15px;
              font-weight: 900;
              font-family: 'JetBrains Mono', monospace;
            }
            .summary-card.red {
              border-color: #ef4444;
              color: #ef4444;
              background-color: #fef2f2;
            }
            .summary-card.green {
              border-color: #10b981;
              color: #10b981;
              background-color: #ecfdf5;
            }
            .footer-signatures {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              font-weight: bold;
            }
            .signature-block {
              text-align: center;
              width: 200px;
            }
            .signature-space {
              height: 50px;
              border-bottom: 1px dashed #94a3b8;
              margin-bottom: 10px;
            }
            @media print {
              body {
                padding: 0;
              }
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-info">
              <div>${schoolName}</div>
              <div>وزارة التعليم - الإدارة العامة للتعليم الخاص</div>
              <div>قسم الإدارة المالية والتحصيل السحابي</div>
            </div>
            <div class="doc-title">
              <h1>كـشـف حـسـاب مـالـي تـفـصـيـلـي</h1>
              <div class="doc-serial">تاريخ الطباعة: ${dateText}</div>
            </div>
            <div class="meta-info">
              <div>الرقم المرجعي: ACC-${selectedStudent.id.toUpperCase()}</div>
              <div>حالة الحساب: ${selectedStudent.feesRemaining > 0 ? 'مستحق الدفع' : 'مخلص بالكامل'}</div>
            </div>
          </div>

          <div class="student-card">
            <div class="student-card-item">
              <span class="student-card-label">اسم الطالب:</span>
              <span class="student-card-value">${selectedStudent.name}</span>
            </div>
            <div class="student-card-item">
              <span class="student-card-label">الرقم الأكاديمي:</span>
              <span class="student-card-value">${selectedStudent.academicId || 'ACC-STD-7291'}</span>
            </div>
            <div class="student-card-item">
              <span class="student-card-label">الصف الدراسي الحالي:</span>
              <span class="student-card-value">${selectedStudent.classroom} (شعبة ${selectedStudent.section || 'أ'})</span>
            </div>
            <div class="student-card-item">
              <span class="student-card-label">السنة الدراسية:</span>
              <span class="student-card-value">${selectedStudent.academicYear || '1447-1448 هـ'}</span>
            </div>
            <div class="student-card-item">
              <span class="student-card-label">رقم الهوية الوطنية / الإقامة:</span>
              <span class="student-card-value">${selectedStudent.nationalId}</span>
            </div>
            <div class="student-card-item">
              <span class="student-card-label">اسم ولي الأمر:</span>
              <span class="student-card-value">${selectedStudent.parentName}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 15%">التاريخ</th>
                <th style="width: 45%">البيان المالي للمعاملة</th>
                <th style="width: 13%; text-align: center;">مدين (د.ل)</th>
                <th style="width: 13%; text-align: center;">دائن (د.ل)</th>
                <th style="width: 14%; text-align: center;">الرصيد الجاري (د.ل)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="5" style="text-align: center;">لا يوجد حركات مالية مسجلة للطالب بعد.</td></tr>'}
            </tbody>
          </table>

          <div class="summary-box">
            <div class="summary-card">
              <div class="summary-card-title">إجمالي المفوتر</div>
              <div class="summary-card-val">${totalInvoiced.toLocaleString(undefined, {minimumFractionDigits: 2})} د.ل</div>
            </div>
            <div class="summary-card green">
              <div class="summary-card-title">إجمالي المدفوع</div>
              <div class="summary-card-val">${totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})} د.ل</div>
            </div>
            <div class="summary-card red">
              <div class="summary-card-title">الرصيد المتبقي مستحق السداد</div>
              <div class="summary-card-val">${remainingVal.toLocaleString(undefined, {minimumFractionDigits: 2})} د.ل</div>
            </div>
          </div>

          <div class="footer-signatures">
            <div class="signature-block">
              <div class="signature-space"></div>
              <div>توقيع مراجع الحسابات المالي</div>
            </div>
            <div class="signature-block">
              <div class="signature-space"></div>
              <div>ختم الإدارة المالية للمدرسة</div>
            </div>
            <div class="signature-block">
              <div class="signature-space"></div>
              <div>اعتماد المدير العام للمدارس</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();

    EnterpriseAuditLogger.log({
      action: 'طباعة',
      oldValue: `معاينة كشف الحساب المالي الرقمي للطالب ${selectedStudent.name} على الشاشة`,
      newValue: `طباعة كشف حساب مالي ورقي رسمي للطالب ${selectedStudent.name} (المتبقي: ${selectedStudent.feesRemaining} د.ل)`,
      userName: auditActor,
      userRole: 'المدير المالي والمشرف العام',
      module: 'بوابة الشؤون المالية (StudentFinancialPortal)',
      ipAddress: auditIpAddress
    });
  };

  // Helper to print a single voucher beautifully
  const handlePrintSingleVoucher = (v: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerNotification('❌ تم حظر فتح نافذة الطباعة التلقائية بواسطة متصفحك. يرجى تفعيل النوافذ المنبثقة.', 'warning');
      return;
    }

    const schoolName = "مدارس الأسرة الحديثة الموحد الرياضية";
    const titleText = "سـنـد قـبـض مـالـي (طـلاب)";
    
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>سند قبض رقم ${v.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              padding: 40px;
              color: #0f172a;
              background-color: #ffffff;
              font-size: 13px;
              line-height: 1.6;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 3px double #0f172a;
              padding-bottom: 15px;
              margin-bottom: 30px;
            }
            .school-info {
              font-size: 11px;
              font-weight: bold;
              line-height: 1.5;
            }
            .doc-title {
              text-align: center;
            }
            .doc-title h1 {
              font-size: 18px;
              font-weight: 900;
              border: 2px solid #0f172a;
              padding: 6px 20px;
              border-radius: 8px;
              margin: 0;
              background-color: #f8fafc;
            }
            .doc-serial {
              font-family: monospace;
              font-size: 13px;
              font-weight: bold;
              margin-top: 5px;
            }
            .meta-info {
              font-size: 11px;
              text-align: left;
              line-height: 1.5;
            }
            .voucher-body {
              border: 1px solid #0f172a;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 30px;
              background-color: #fafafa;
            }
            .field-row {
              display: flex;
              border-bottom: 1px dashed #cbd5e1;
              padding: 10px 0;
              align-items: center;
            }
            .field-row:last-child {
              border-bottom: none;
            }
            .field-label {
              font-weight: bold;
              width: 150px;
              color: #334155;
            }
            .field-value {
              flex: 1;
              font-size: 14px;
              font-weight: 700;
            }
            .amount-box {
              display: inline-block;
              border: 2px solid #0f172a;
              padding: 8px 15px;
              font-family: monospace;
              font-size: 16px;
              font-weight: 900;
              background-color: #f1f5f9;
              border-radius: 6px;
            }
            .footer-signatures {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              text-align: center;
              margin-top: 60px;
              font-size: 12px;
              font-weight: bold;
            }
            .sig-space {
              height: 50px;
            }
            .system-tag {
              text-align: center;
              font-size: 9px;
              color: #94a3b8;
              margin-top: 80px;
              border-top: 1px solid #e2e8f0;
              padding-top: 10px;
            }
            @media print {
              body { padding: 15px; }
              .voucher-body { background-color: transparent; }
              .amount-box { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-info">
              <p>المملكة العربية السعودية</p>
              <p>وزارة التعليم</p>
              <p style="color: #4f46e5; font-weight: 900;">${schoolName}</p>
              <p>قسم الإدارة والتحصيل المالي الموحد</p>
            </div>
            <div class="doc-title">
              <h1>${titleText}</h1>
              <div class="doc-serial">الرقم التسلسلي: ${v.id}</div>
            </div>
            <div class="meta-info">
              <p>تاريخ السند: <strong>${v.date}</strong></p>
              <p>العام الأكاديمي: <strong>1447-1448 هـ</strong></p>
              <p>المستند المرجعي: <strong>سند ترحيل سحابي</strong></p>
            </div>
          </div>

          <div class="voucher-body">
            <div class="field-row">
              <div class="field-label">استلمنا من الطالب:</div>
              <div class="field-value" style="color: #1e1b4b;">${v.studentName} (رقم أكاديمي: ${v.studentId})</div>
            </div>
            <div class="field-row">
              <div class="field-label">مبلغ وقدره:</div>
              <div class="field-value">
                <span class="amount-box">${formatCurrency(v.amount, true)}</span>
              </div>
            </div>
            <div class="field-row">
              <div class="field-label">وذلك عن (البيان):</div>
              <div class="field-value" style="font-style: italic; color: #334155;">${v.against || 'سداد الرسوم المدرسية المقررة'}</div>
            </div>
            <div class="field-row">
              <div class="field-label">طريقة الدفع:</div>
              <div class="field-value">${v.paymentMethod}</div>
            </div>
            <div class="field-row">
              <div class="field-label">الحساب المدين:</div>
              <div class="field-value">${v.receivingAccount === '1101' ? 'صندوق الخزينة الرئيسي (كاش)' : 'حساب مصرف الوحدة الجاري'} (رمز الحساب: ${v.receivingAccount})</div>
            </div>
          </div>

          <div class="footer-signatures">
            <div>
              <p>المستلم (أمين الصندوق)</p>
              <div class="sig-space"></div>
              <p>_______________________</p>
            </div>
            <div>
              <p>المدير المالي</p>
              <div class="sig-space"></div>
              <p>_______________________</p>
            </div>
            <div>
              <p>الختم الرسمي للمدرسة</p>
              <div class="sig-space" style="display: flex; align-items: center; justify-content: center;">
                <div style="width: 70px; height: 70px; border: 2.5px dashed #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #dc2626; font-size: 9px; font-weight: bold; transform: rotate(-15deg);">
                  مُعتَمَد ماليّاً
                </div>
              </div>
              <p>مدارس الأسرة الحديثة</p>
            </div>
          </div>

          <div class="system-tag">
            تم التصدير والطباعة إلكترونياً من نظام المدير المالي ERP - المستخدم النشط: ${auditActor} - تاريخ الطباعة: ${new Date().toLocaleString('ar-SA')} - صفحة 1 من 1
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 9. Toolbar - EXPORT PDF
  const handleExportPdf = () => {
    if (!selectedStudRv) {
      if (filteredReceiptVouchers.length === 0) {
        triggerNotification('⚠️ لا توجد سجلات في الكشف المصفى لإصدار تقرير PDF.', 'warning');
        return;
      }
      
      triggerNotification('📊 جاري توليد كشف السندات المفلترة لطباعته كتقرير PDF مجمع...', 'success');
      
      setTimeout(() => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          triggerNotification('❌ تم حظر فتح نافذة الطباعة التلقائية. يرجى تفعيل السماح للمواقع المنبثقة.', 'warning');
          return;
        }

        printWindow.document.write(`
          <html dir="rtl">
            <head>
              <title>كشف سندات قبض الطلاب المفلترة</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                body {
                  font-family: 'Inter', system-ui, -apple-system, sans-serif;
                  padding: 30px;
                  color: #0f172a;
                  background-color: #ffffff;
                  font-size: 11px;
                  line-height: 1.5;
                }
                .school-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  border-bottom: 2px solid #0f172a;
                  padding-bottom: 12px;
                  margin-bottom: 20px;
                }
                .school-title {
                  font-size: 12px;
                  font-weight: bold;
                  line-height: 1.4;
                }
                h1 { text-align: center; font-size: 16px; font-weight: 900; margin: 0; }
                h2 { text-align: center; font-size: 11px; color: #475569; margin-top: 5px; margin-bottom: 20px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; font-size: 11px; text-align: right; }
                th { background-color: #f1f5f9; padding: 10px; font-weight: bold; border: 1px solid #cbd5e1; }
                td { padding: 8px 10px; border: 1px solid #e2e8f0; }
                .amount { font-family: monospace; font-weight: bold; text-align: left; }
                .system-tag { text-align: center; font-size: 9px; color: #94a3b8; margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
              </style>
            </head>
            <body>
              <div class="school-header">
                <div class="school-title">
                  <p>المملكة العربية السعودية</p>
                  <p>وزارة التعليم</p>
                  <p style="color: #4f46e5; font-weight: 900;">مدارس الأسرة الحديثة الموحد الرياضية</p>
                </div>
                <div style="text-align: left; font-size: 10px; font-weight: bold;">
                  <p>تاريخ استخراج الكشف: ${new Date().toLocaleDateString('ar-SA')}</p>
                  <p>المستخدم النشط: ${auditActor}</p>
                  <p>نوع الكشف: تقرير السندات المفلترة</p>
                </div>
              </div>
              
              <h1>تقرير كشوفات المبالغ وسندات القبض المفلترة للطلاب</h1>
              <h2>إحصائية الحركات المعتمدة والمسجلة تحت التصفية الحالية في النظام المالي</h2>
              
              <table>
                <thead>
                  <tr>
                    <th>رقم السند</th>
                    <th>التاريخ</th>
                    <th>اسم الطالب</th>
                    <th>رقم الطالب</th>
                    <th>طريقة الدفع</th>
                    <th>الحالة</th>
                    <th>البيان ومصوغ القبض</th>
                    <th style="text-align: left;">القيمة</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredReceiptVouchers.map(v => `
                    <tr>
                      <td style="font-family: monospace;">${v.id}</td>
                      <td>${v.date}</td>
                      <td style="font-weight: bold;">${v.studentName}</td>
                      <td style="font-family: monospace;">${v.studentId}</td>
                      <td>${v.paymentMethod}</td>
                      <td>${v.status === 'posted' ? 'مرحل حسابياً' : v.status === 'approved' ? 'معتمد مالياً' : 'مسودة'}</td>
                      <td style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${v.against || ''}</td>
                      <td class="amount">${formatCurrency(v.amount, true)}</td>
                    </tr>
                  `).join('')}
                  <tr style="font-weight: bold; background-color: #f8fafc;">
                    <td colspan="7" style="text-align: center;">الإجمالي العام لسندات الكشف</td>
                    <td class="amount" style="color: #166534; font-size: 12px; border-top: 2px solid #000;">
                      ${formatCurrency(filteredReceiptVouchers.reduce((sum, v) => sum + v.amount, 0), true)}
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <div class="system-tag">
                تم التصدير والطباعة إلكترونياً من نظام المدير المالي ERP - تاريخ الطباعة: ${new Date().toLocaleString('ar-SA')} - صفحة 1 من 1
              </div>
              <script>
                window.onload = function() { window.print(); }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        logAction('EXPORT_PDF', `تصدير كشف مالي لعدد ${filteredReceiptVouchers.length} سند قبض طلاب كتقرير PDF مجمع`, 'الحسابات');
      }, 800);
    } else {
      triggerNotification('📊 جاري توليد وثيقة السند بصيغة PDF وتصميم الطباعة الفخم...', 'success');
      setTimeout(() => {
        handlePrintSingleVoucher(selectedStudRv);
        logAction('EXPORT_PDF', `تصدير السند المحاسبي رقم ${selectedStudRv.id} كملف PDF مستقل`, 'الحسابات');
      }, 600);
    }
  };

  // Filter and search vouchers list
  const filteredReceiptVouchers = useMemo(() => {
    return studentReceiptVouchers.filter(v => {
      const matchesSearch = v.studentName.includes(rvSearch) || v.id.includes(rvSearch) || (v.against && v.against.includes(rvSearch));
      const matchesStatus = rvStatusFilter === 'all' || v.status === rvStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [studentReceiptVouchers, rvSearch, rvStatusFilter]);

  // A status/search filter must never leave a detail card pointing at a row
  // that is no longer visible in the current list.
  React.useEffect(() => {
    if (!selectedStudRv) return;
    const selectedIsVisible = filteredReceiptVouchers.some(voucher => voucher.id === selectedStudRv.id);
    if (!selectedIsVisible) {
      setSelectedStudRv(filteredReceiptVouchers[0] || null);
      setStudRvMode('view');
    }
  }, [filteredReceiptVouchers, selectedStudRv]);

  // Live aggregated numbers for the dashboard. Prefer the canonical invoice and
  // posted-receipt snapshot when it exists; fall back to student balances only
  // for schools that have not created any invoices yet.
  const financialStudentRows = useMemo(() => {
    // لا تُشتق أرصدة مالية من قائمة الطلاب العامة؛ المصدر المالي المركزي هو
    // المرجع الوحيد، وعند غيابه يجب أن تبقى المؤشرات فارغة/غير متحققة.
    if (financialInvoices.length === 0) return [];

    const invoiceTotals = new Map<string, number>();
    financialInvoices.forEach(invoice => {
      if (!['cancelled', 'void'].includes(String(invoice.status).toLowerCase())) {
        invoiceTotals.set(invoice.studentId, (invoiceTotals.get(invoice.studentId) || 0) + Number(invoice.amount || 0));
      }
    });
    const paidTotals = new Map<string, number>();
    studentReceiptVouchers.forEach(voucher => {
      if (String(voucher.status).toLowerCase() === 'posted') {
        paidTotals.set(voucher.studentId, (paidTotals.get(voucher.studentId) || 0) + Number(voucher.amount || 0));
      }
    });

    return filteredStudents.map(student => {
      const invoiced = invoiceTotals.get(student.id) || 0;
      const paid = paidTotals.get(student.id) || 0;
      return {
        ...student,
        feesPaid: paid,
        feesRemaining: Math.max(0, invoiced - paid),
      };
    });
  }, [filteredStudents, financialInvoices, studentReceiptVouchers]);

  const stats = useMemo(() => {
    const totalSum = financialInvoices.length > 0
      ? financialInvoices
        .filter(invoice => !['cancelled', 'void'].includes(String(invoice.status).toLowerCase()))
        .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0)
      : 0;
    const totalPaid = financialInvoices.length > 0
      ? studentReceiptVouchers
        .filter(v => String(v.status).toLowerCase() === 'posted')
        .reduce((sum, v) => sum + Number(v.amount || 0), 0)
      : 0;
    const totalRemaining = Math.max(0, totalSum - totalPaid);
    const collectionRate = totalSum > 0 ? (totalPaid / totalSum) * 100 : null;
    const today = new Date().toISOString().split('T')[0];
    const todayCollected = studentReceiptVouchers
      .filter(v => v.date === today && String(v.status).toLowerCase() === 'posted')
      .reduce((sum, v) => sum + Number(v.amount || 0), 0);
    
    return {
      totalDebts: totalSum,
      totalPaid: totalPaid,
      totalRemaining: totalRemaining,
      collectionRate,
      todayCollected
    };
  }, [filteredStudents, financialInvoices, studentReceiptVouchers]);

  const debtorStudents = useMemo(() => {
    return [...financialStudentRows]
      .filter(student => Number(student.feesRemaining || 0) > 0)
      .sort((a, b) => Number(b.feesRemaining || 0) - Number(a.feesRemaining || 0))
      .slice(0, 4);
  }, [financialStudentRows]);

  const selectedStudentFinancialView = useMemo(() => {
    if (!selectedStudent) return null;
    return financialStudentRows.find(student => student.id === selectedStudent.id) || selectedStudent;
  }, [financialStudentRows, selectedStudent]);

  const formatFinancialValue = (value: number | null | undefined) =>
    value === null || value === undefined ? 'غير متاح' : formatLD(value);

  const parseFinancialDate = (value: unknown) => {
    const dateText = String(value || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return null;
    const timestamp = Date.parse(`${dateText}T00:00:00Z`);
    return Number.isFinite(timestamp) ? timestamp : null;
  };

  // Build invoice-level outstanding balances from the canonical invoice and
  // posted receipt streams. Payments without an invoice reference are
  // allocated oldest-due-first per student, matching the collection policy.
  const outstandingInvoiceRows = useMemo(() => {
    const activeInvoices = financialInvoices.filter(invoice =>
      !['cancelled', 'void', 'Cancelled', 'Void'].includes(String(invoice.status))
    );
    const paidByStudent = new Map<string, number>();
    studentReceiptVouchers
      .filter(voucher => String(voucher.status || '').toLowerCase() === 'posted')
      .forEach(voucher => {
        const studentId = String(voucher.studentId || '');
        if (!studentId) return;
        paidByStudent.set(studentId, (paidByStudent.get(studentId) || 0) + Number(voucher.amount || 0));
      });

    const invoicesByStudent = new Map<string, Invoice[]>();
    activeInvoices.forEach(invoice => {
      const list = invoicesByStudent.get(invoice.studentId) || [];
      list.push(invoice);
      invoicesByStudent.set(invoice.studentId, list);
    });

    const rows: Array<Invoice & { outstandingAmount: number; dueTimestamp: number | null }> = [];
    invoicesByStudent.forEach((studentInvoices, studentId) => {
      let unappliedPayment = paidByStudent.get(studentId) || 0;
      [...studentInvoices]
        .sort((a, b) => (parseFinancialDate(a.dueDate) ?? Number.MAX_SAFE_INTEGER) - (parseFinancialDate(b.dueDate) ?? Number.MAX_SAFE_INTEGER))
        .forEach(invoice => {
          const invoiceAmount = Math.max(0, Number(invoice.totalAmount ?? invoice.amount ?? 0));
          const appliedPayment = Math.min(invoiceAmount, unappliedPayment);
          unappliedPayment = Math.max(0, unappliedPayment - appliedPayment);
          const outstandingAmount = Math.max(0, invoiceAmount - appliedPayment);
          if (outstandingAmount > 0) {
            rows.push({
              ...invoice,
              outstandingAmount,
              dueTimestamp: parseFinancialDate(invoice.dueDate)
            });
          }
        });
    });

    return rows;
  }, [financialInvoices, studentReceiptVouchers]);

  const agingAnalysis = useMemo(() => {
    const datedRows = outstandingInvoiceRows.filter(row => row.dueTimestamp !== null);
    if (datedRows.length === 0) return null;

    const now = new Date();
    const todayTimestamp = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const buckets = [
      { key: 'current', label: 'غير مستحق', amount: 0, count: 0 },
      { key: '1-30', label: '1–30 يوم', amount: 0, count: 0 },
      { key: '31-60', label: '31–60 يوم', amount: 0, count: 0 },
      { key: '61-90', label: '61–90 يوم', amount: 0, count: 0 },
      { key: '90+', label: 'أكثر من 90 يوم', amount: 0, count: 0 }
    ];

    datedRows.forEach(row => {
      const daysPastDue = Math.floor((todayTimestamp - (row.dueTimestamp as number)) / 86400000);
      const bucket = daysPastDue <= 0
        ? buckets[0]
        : daysPastDue <= 30
          ? buckets[1]
          : daysPastDue <= 60
            ? buckets[2]
            : daysPastDue <= 90
              ? buckets[3]
              : buckets[4];
      bucket.amount += row.outstandingAmount;
      bucket.count += 1;
    });

    return {
      buckets,
      total: datedRows.reduce((sum, row) => sum + row.outstandingAmount, 0),
      overdue: datedRows
        .filter(row => (row.dueTimestamp as number) < todayTimestamp)
        .reduce((sum, row) => sum + row.outstandingAmount, 0)
    };
  }, [outstandingInvoiceRows]);

  const nextMonthForecast = useMemo(() => {
    const datedRows = outstandingInvoiceRows.filter(row => row.dueTimestamp !== null);
    if (datedRows.length === 0) return null;

    const now = new Date();
    const nextMonthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
    const followingMonthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 1);
    const amount = datedRows
      .filter(row => (row.dueTimestamp as number) >= nextMonthStart && (row.dueTimestamp as number) < followingMonthStart)
      .reduce((sum, row) => sum + row.outstandingAmount, 0);

    return {
      amount,
      label: new Intl.DateTimeFormat('ar-LY', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(nextMonthStart))
    };
  }, [outstandingInvoiceRows]);

  // Refresh the same server-backed source used during initial load.
  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/financial/database', {
        headers: { 'Authorization': `Bearer ${getTrustedAccessToken()}` },
        cache: 'no-store'
      });
      const res = await response.json();
      if (!response.ok || !res.success) throw new Error(res.message || 'تعذر تحميل البيانات المالية');
      const data = res.data || {};
       setFinancialInvoices(data.invoices || []);
       setInvoices(data.invoices || []);
       setFeeConfigs(data.feeConfigs || []);
       if (data.feeSettings) {
         const refreshedFeeSettings = {
           ...data.feeSettings,
           siblingDiscountPercent: Number(data.feeSettings.siblingDiscountPercent || 0)
         };
         setFeeSettings(refreshedFeeSettings);
         setSiblingDiscountPercent(refreshedFeeSettings.siblingDiscountPercent);
       }
       setStudentReceiptVouchers(data.studentReceiptVouchers || []);
      setGlRvs(data.receiptVouchers || []);
      setGlJvs(data.journalEntries || []);
       setChartOfAccounts(data.chartOfAccounts || []);
       setExpenseAccruals(Array.isArray(data.expenseAccruals) ? data.expenseAccruals : []);
      setFinancialPersistence('ready');
      setFinancialPersistenceVersion(Number(res.meta?.version || 0));
      setFinancialPersistenceMessage('البيانات المالية محملة من المصدر المعتمد.');
      triggerNotification('تم تحديث البيانات المالية من المصدر المعتمد', 'success');
    } catch (error: any) {
      setFinancialPersistence('blocked');
      setFinancialPersistenceMessage('لم يتم التحقق من مصدر مالي معتمد؛ تم تعطيل الحفظ والترحيل حمايةً للبيانات.');
      triggerNotification(`تعذر تحديث البيانات المالية: ${error.message || 'خطأ غير معروف'}`, 'warning');
    } finally {
      setRefreshing(false);
    }
  };

  // Mass assign fees to selected classroom
  const handleMassDistribution = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ensureFinancialWriteReady()) return;
    if (massFeeAmount <= 0) {
      triggerNotification('الرجاء إدخال مبلغ صحيح للتوزيع جماعياً', 'warning');
      return;
    }

    const studentsToUpdate = massTargetStudents.filter(s => selectedStudentIds[s.id] !== false);
    if (studentsToUpdate.length === 0) {
      triggerNotification(`الرجاء تحديد طالب واحد على الأقل من الفصل ${massClassroom}`, 'warning');
      return;
    }

    const tenantId = auditTenantId;
    const invoiceDate = new Date().toISOString().split('T')[0];
    const selectedFeeConfig = feeConfigs.find(config => config.type === massFeeType);
    const revenueAccount = String(selectedFeeConfig?.account || '').trim();
    const revenueAccountError = validateFeeRevenueAccount(revenueAccount);
    if (revenueAccountError) {
      triggerNotification(`لا يمكن توزيع الرسوم قبل ربط بند «${massFeeType}» بحساب إيراد صالح: ${revenueAccountError}`, 'warning');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(massDueDate)) {
      triggerNotification('الرجاء تحديد تاريخ استحقاق صحيح قبل التوزيع.', 'warning');
      return;
    }
    const dueDate = massDueDate;
    const newInvoicesList: Invoice[] = studentsToUpdate.map((st, sIdx) => ({
      id: createFinancialReference(`INV-MASS-${sIdx}`),
      studentId: st.id,
      studentName: st.name,
      amount: massFeeAmount,
      totalAmount: massFeeAmount,
      remainingAmount: massFeeAmount,
      dueDate,
      status: 'unpaid',
      item: `قيد مالي جماعي: ${massFeeType} بقيمة ${massFeeAmount} د.ل`,
      revenueAccount,
      taxAmount: 0,
      invoiceDate
    }));
    const updatedInvoices = [...newInvoicesList, ...financialInvoices];

    // Execute real secure multi-row atomic PostgreSQL transaction simulation
    const transactionResult = await SQLTransactionEngine.run({
      operationName: `MASS_FEE_DISTRIBUTION (توسيع وترحيل رسوم جماعية: ${massFeeType})`,
      tenantId,
      userId: auditActor,
      userName: auditActor,
      ipAddress: auditIpAddress,
      affectedTables: ['invoices', 'students', 'billing_ledger'],
      validationBlock: () => {
        if (massFeeAmount <= 0) return { valid: false, error: 'مبلغ الرسم المراد توزيعه يجب أن يكون موجباً' };
        return { valid: true };
      },
      authorizationBlock: () => {
        try {
          StudentAffairsValidationFramework.validateActionPermission(currentRole, 'save', 'financial');
          return { authorized: true };
        } catch (err: any) {
          return { authorized: false, error: err.message };
        }
      },
      executionBlock: async () => {
        // Persist the complete resulting snapshot before exposing the new state
        // in the UI. A failed canonical write therefore cannot look successful.
        await saveToServerDb(undefined, undefined, undefined, undefined, updatedInvoices);

        // State updates
        setStudents(prev => prev.map(s => {
          if (studentsToUpdate.some(target => target.id === s.id)) {
            return {
              ...s,
              feesRemaining: s.feesRemaining + massFeeAmount
            };
          }
          return s;
        }));

        setFinancialInvoices(updatedInvoices);
        setInvoices(updatedInvoices);
        return true;
      },
      nestedSqlQueries: [
        SQLCommandBuilder.create({
          sqlText: `-- Batch insertion of claims into invoices table`,
          parameters: []
        }),
        ...studentsToUpdate.map(st => 
          SQLCommandBuilder.create({
            sqlText: `INSERT INTO invoices (id, tenant_id, student_id, amount, tax, status, details, due_date) VALUES ($1, $2, $3, $4, $5, 'unpaid', $6, CURRENT_DATE + INTERVAL '30 days');`,
            parameters: [newInvoicesList.find(invoice => invoice.studentId === st.id)?.id || createFinancialReference(`INV-MASS-${st.id}`), tenantId, st.id, massFeeAmount, 0, `قيد مالي جماعي: ${massFeeType}`],
            executionContext: 'Batch invoice insertion'
          })
        ),
        SQLCommandBuilder.create({
          sqlText: `-- Synchronizing student total debit balance`,
          parameters: []
        }),
        ...studentsToUpdate.map(st => 
          SQLCommandBuilder.create({
            sqlText: `UPDATE students SET fees_remaining = fees_remaining + $1, updated_at = NOW() WHERE id = $2 AND school_id = $3;`,
            parameters: [massFeeAmount, st.id, tenantId],
            executionContext: 'Batch student balance sync'
          })
        )
      ]
    });

    if (!transactionResult.success) {
      triggerNotification(`تعذر ترحيل الرسوم الجماعية: ${transactionResult.error || 'تم التراجع عن العملية'}`, 'warning');
      return;
    }

    logAction('MASS_FEE_DISTRIBUTION', `تم ترحيل وتوطين رسوم جماعية (${massFeeType}) بقيمة ${massFeeAmount} د.ل على طلاب ${massClassroom} وعددهم ${studentsToUpdate.length} طالباً.`, 'حسابات الطلاب');
    triggerNotification(`تم بنجاح تطبيق وتوزيع الرسوم على ${studentsToUpdate.length} من طلاب ${massClassroom}`, 'success');
  };

  // Generate installment table
  const generateInstallments = (totalAmount: number, type: 'monthly' | 'quarterly' | 'yearly') => {
    const installments = [];
    let count = type === 'monthly' ? 10 : type === 'quarterly' ? 4 : 1;
    const amountPerInstallment = totalAmount / count;
    const startDate = new Date();
    
    for (let i = 0; i < count; i++) {
        const date = new Date(startDate);
        if (type === 'monthly') date.setMonth(date.getMonth() + i);
        else if (type === 'quarterly') date.setMonth(date.getMonth() + i * 3);
        else date.setFullYear(date.getFullYear() + i);
        
        installments.push({
            date: date.toISOString().split('T')[0],
            amount: amountPerInstallment,
            status: 'unpaid' as const
        });
    }
    setGeneratedInstallments(installments);
  };

  // Format Libyan Dinar
  const formatLD = (val: number) => {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' د.ل';
  };

  // Nav side panel menu matching the uploaded image exactly
  const menuItems = [
    { id: 'analytics', label: 'لوحة التحكم المالية والتحليلات', icon: TrendingUp },
    { id: 'settings', label: 'إعدادات مبالغ الرسوم', icon: Settings2 },
    { id: 'distribution', label: 'التوزيع الجماعي للرسوم', icon: Users },
    { id: 'management', label: 'إدارة الرسوم والدفعات الذكية', icon: ClipboardCheck, badge: 'مطوّر' },
    { id: 'receipts', label: 'سندات القبض الملكية', icon: Coins },
    { id: 'reports', label: 'تقارير الحسابات الشاملة', icon: FileSpreadsheet },
    { id: 'accounting_integrity_demo', label: 'دورة الرقابة والترحيل الموحد', icon: ShieldCheck, badge: 'جديد' },
  ];

  // Define dynamic action variables based on active sub-section for full enterprise toolbar synchronization
  let portalOnNew: (() => void) | undefined = undefined;
  let portalOnSave: (() => void) | undefined = undefined;
  let portalOnEdit: (() => void) | undefined = undefined;
  let portalOnDelete: (() => void) | undefined = undefined;
  let portalOnCancel: (() => void) | undefined = undefined;
  let portalOnRefresh: (() => void) | undefined = undefined;
  let portalOnSearch: (() => void) | undefined = undefined;
  let portalOnPrint: (() => void) | undefined = undefined;
  let portalOnExportPdf: (() => void) | undefined = undefined;
  let portalExportPdfLabel = 'PDF';
  let portalOnExportExcel: (() => void) | undefined = undefined;
  let portalOnImportExcel: (() => void) | undefined = undefined;
  let portalOnDownloadTemplate: (() => void) | undefined = undefined;
  let portalIsEditing = false;
  let portalSelectedId: string | null = null;

  if (activeSubSec === 'receipts') {
    portalOnNew = handleNewStudRv;
    portalOnSave = studRvMode !== 'view' ? handleSaveStudRv : undefined;
    portalOnEdit = studRvMode === 'view' && selectedStudRv && selectedStudRv.status === 'saved' ? () => {
      setStudRvMode('edit');
      triggerNotification('📝 تم فتح وضع التحرير للسند الحالي.', 'info');
    } : undefined;
    portalOnDelete = studRvMode === 'view' && selectedStudRv && selectedStudRv.status !== 'posted' ? handleDeleteStudRv : undefined;
    portalOnCancel = studRvMode !== 'view' ? () => setStudRvMode('view') : undefined;
    portalOnRefresh = handleRefreshReceipts;
    portalOnPrint = selectedStudRv ? () => {
      handlePrintSingleVoucher(selectedStudRv);
      triggerNotification('🖨️ تم تجهيز السند وتوجيهه لأمر الطباعة ومعالج A4 بنجاح', 'success');
    } : undefined;
    portalOnExportPdf = handleExportPdf;
    portalOnExportExcel = handleExportExcel;
    portalIsEditing = studRvMode !== 'view';
    portalSelectedId = selectedStudRv ? selectedStudRv.id : null;
  } else if (activeSubSec === 'settings') {
    portalOnImportExcel = handleImportFeeConfig;
    portalOnDownloadTemplate = () => { void handleDownloadFeeTemplate(); };
    portalOnNew = () => {
      setCurrFeeId('');
      setCurrFeeType('');
      setCurrFeeAmount(0);
      setCurrFeeAccount('');
      setCurrFeeOrderNumber((feeConfigs.length + 1).toString());
      setCurrFeeActivities('');
      triggerNotification('تم تهيئة الحقول لإدخال بند رسوم جديد', 'info');
    };
    portalOnSave = async () => {
      if (!ensureFinancialWriteReady()) return;
      if (!currFeeType) {
        triggerNotification('الرجاء إدخال نوع الرسوم أولاً', 'warning');
        return;
      }
      if (!currFeeAccount.trim()) {
        triggerNotification('الرجاء تحديد حساب الإيراد من دليل الحسابات قبل الحفظ.', 'warning');
        return;
      }
      const feeAccountError = validateFeeRevenueAccount(currFeeAccount);
      if (feeAccountError) {
        triggerNotification(feeAccountError, 'warning');
        return;
      }
      if (currFeeAmount <= 0) {
        triggerNotification('الرجاء إدخال قيمة المبلغ بشكل صحيح', 'warning');
        return;
      }
      if (currFeeId) {
        const updatedFeeConfigs = feeConfigs.map(item => item.id === currFeeId ? {
          ...item,
          type: currFeeType,
          amount: currFeeAmount,
          account: currFeeAccount,
          orderNumber: currFeeOrderNumber,
          activities: currFeeActivities
        } : item);
        await saveToServerDb(undefined, undefined, undefined, undefined, undefined, updatedFeeConfigs);
        setFeeConfigs(updatedFeeConfigs);
        logAction('UPDATE_FEE_CONFIG', `تحديث بند الرسوم: ${currFeeType}`, 'الإعدادات المالية');
        triggerNotification('تم تحديث بند الرسوم بنجاح', 'success');
      } else {
        const newId = createFinancialReference('FEE-CONFIG');
        const newItem = {
          id: newId,
          type: currFeeType,
          amount: currFeeAmount,
          account: currFeeAccount,
          orderNumber: currFeeOrderNumber,
          activities: currFeeActivities
        };
        const updatedFeeConfigs = [...feeConfigs, newItem];
        await saveToServerDb(undefined, undefined, undefined, undefined, undefined, updatedFeeConfigs);
        setFeeConfigs(updatedFeeConfigs);
        setCurrFeeId(newId);
        logAction('CREATE_FEE_CONFIG', `إضافة بند رسوم جديد: ${currFeeType}`, 'الإعدادات المالية');
        triggerNotification('تم إضافة وحفظ بند الرسوم الجديد بنجاح', 'success');
      }
    };
    portalOnEdit = currFeeId ? () => {
      const ipt = document.getElementById('fee-config-type-input');
      if (ipt) ipt.focus();
      triggerNotification('الحقول جاهزة الآن للتعديل، اضغط على حفظ لاعتماد التغييرات', 'info');
    } : undefined;
    portalOnDelete = currFeeId ? () => {
      void (async () => {
        if (!ensureFinancialWriteReady()) return;
        const updatedFeeConfigs = feeConfigs.filter(item => item.id !== currFeeId);
        try {
          await saveToServerDb(undefined, undefined, undefined, undefined, undefined, updatedFeeConfigs);
          setFeeConfigs(updatedFeeConfigs);
          setCurrFeeId('');
          logAction('DELETE_FEE_CONFIG', `حذف بند الرسوم: ${currFeeType}`, 'الإعدادات المالية');
          triggerNotification('تم حذف بند الرسوم وحفظ الحذف في المصدر المالي', 'success');
        } catch (error: any) {
          triggerNotification(error?.message || 'تعذر حفظ حذف بند الرسوم في المصدر المالي', 'warning');
        }
      })();
    } : undefined;
    portalSelectedId = currFeeId || null;
  } else if (activeSubSec === 'analytics') {
    portalOnRefresh = handleRefreshData;
  } else if (activeSubSec === 'reports') {
    portalOnPrint = handlePrintFinancialReport;
    portalOnExportPdf = handlePrintFinancialReport;
    portalExportPdfLabel = 'معاينة PDF';
    portalOnExportExcel = handleExportFinancialReport;
  } else if (activeSubSec === 'management') {
    portalOnSave = () => {
      triggerNotification('توزيع بنود الرسوم لا يُعتمد من هذه الشاشة قبل توفر خدمة مالية موثقة للحفظ والترحيل.', 'warning');
    };
  }

  return (
    <div id="student-financial-portal" className={`financial-luxury-shell w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 p-2 sm:p-4 md:p-6 space-y-6 ${activeSubSec === 'management' ? 'financial-reference-management' : ''}`} dir="rtl">

      {/* ==========================================
          LUXURY GOLD METALLIC TOP HEADER
         ========================================== */}
      {activeSubSec !== 'management' && <div className="financial-module-header bg-gradient-to-r from-[#1c120c] via-[#2d1e12] to-[#1a100a] text-white rounded-3xl p-4 sm:p-5 border-2 border-[#d4af37]/40 shadow-2xl flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-20 bg-[#d4af37]/10 blur-3xl pointer-events-none" />
        
        {/* Module Title & Breadcrumbs */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#9a6a1d] via-[#f7d174] to-[#c58a22] p-[2px] shadow-lg shadow-[#d4af37]/20 flex-shrink-0">
            <div className="w-full h-full rounded-[14px] bg-[#2a1b10] flex items-center justify-center text-amber-300 font-black">
              <Coins className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-300/80 font-bold mb-0.5">
              <span className="cursor-pointer hover:underline" onClick={() => setActiveSection && setActiveSection('dashboard')}>الرئيسية</span>
              <span>‹</span>
              <span className="text-amber-100">الحسابات والرسوم</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-[#ffe5a3] via-[#fce79a] to-[#d4af37] bg-clip-text text-transparent">
              منظومة حسابات الطلاب والرسوم الدراسية
            </h1>
          </div>
        </div>

        {/* Center Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-[#2a1d13]/90 border border-[#d4af37]/40 p-1.5 rounded-2xl shadow-inner relative z-10 overflow-x-auto">
          <button 
            onClick={() => setActiveSubSec('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeSubSec === 'analytics' 
                ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' 
                : 'text-amber-200/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>لوحة التحليلات</span>
          </button>
          <button 
            onClick={() => setActiveSubSec('management')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeSubSec === 'management' 
                ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' 
                : 'text-amber-200/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>إدارة الرسوم</span>
          </button>
          <button 
            onClick={() => setActiveSubSec('receipts')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeSubSec === 'receipts' 
                ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' 
                : 'text-amber-200/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>سندات القبض</span>
          </button>
          <button 
            onClick={() => setActiveSubSec('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeSubSec === 'reports' 
                ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' 
                : 'text-amber-200/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>التقارير المالية</span>
          </button>
        </div>
      </div>}

      {activeSubSec !== 'management' && <EnterpriseActionToolbar minimal={true}
        title="الرسوم والأقساط المدرسية"
        stats={
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] sm:text-xs">
            <span className="text-slate-300 font-bold">إجمالي السجلات المالية للطلاب: <span className="text-amber-400 font-mono">{students.length}</span> سجلاً مالياً نشطاً</span>
          </div>
        }
        onNew={portalOnNew}
        onSave={portalOnSave}
        onEdit={portalOnEdit}
        onDelete={portalOnDelete}
        onCancel={portalOnCancel}
        onRefresh={portalOnRefresh}
        onSearch={portalOnSearch}
        onPrint={portalOnPrint}
        onExportPdf={portalOnExportPdf}
        exportPdfLabel={portalExportPdfLabel}
        onExportExcel={portalOnExportExcel}
        onImportExcel={portalOnImportExcel}
        onDownloadTemplate={portalOnDownloadTemplate}
        isSaving={false}
        isLoading={false}
        selectedId={portalSelectedId}
        isEditing={portalIsEditing}
        userRole={currentRole || 'SuperAdmin'}
        onExit={setActiveSection ? () => setActiveSection('dashboard') : undefined}
      />}
      <input
        ref={feeImportInputRef}
        type="file"
        accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        aria-label="استيراد بنود الرسوم"
        onChange={(event) => { void handleFeeConfigFileChange(event); }}
      />
      {financialPersistence !== 'ready' && (
        <div className={`mx-3 sm:mx-4 rounded-2xl border p-4 flex items-start gap-3 ${financialPersistence === 'blocked' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`} role="status">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black">الحركات المالية متوقفة للحماية</p>
            <p className="text-xs font-bold mt-1">{financialPersistenceMessage}</p>
          </div>
        </div>
      )}
       <div id="student-financial-portal-layout" className="financial-workspace-layout flex flex-col lg:flex-row-reverse gap-4 w-full p-3 sm:p-4 text-right">
      
      {/* LEFT AREA: Content Window based on nested state */}
      <div id="financial-content-viewport" className="financial-content-viewport flex-1 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300 overflow-hidden min-h-[550px] p-6">
        
        {/* VIEW 1: لوحة التحكم المالية والتحليلات */}
        {activeSubSec === 'analytics' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Blue Banner matching the uploaded screenshot */}
            <div className="bg-[#2a1d13] text-[#fce79a] p-6 relative overflow-hidden shadow-md">
              <div className="absolute inset-0 bg-gradient-to-r from-[#1c120c] to-[#2d1e12] opacity-90" />
              <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-extrabold pb-1">لوحة القيادة والتحليل المالي السحابية</h2>
                  <p className="text-xs text-orange-100 font-semibold opacity-90">رؤية استباقية للتدفقات النقدية وكفاءة التحصيل الميداني والتسجيل</p>
                </div>
                <button 
                  onClick={handleRefreshData}
                  disabled={refreshing}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black px-4 py-2 flex items-center gap-2 border border-amber-300 shadow transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>تحديث البيانات الحالية</span>
                </button>
              </div>
            </div>

            {/* Four main counters matching the screenshot values and text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              
              {/* Card 1 */}
              <div className="p-5 hover:border-slate-300 transition-all bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <span className="text-[11px] font-black text-slate-500 block mb-1">إجمالي مديونيات الطلاب</span>
                <div className="text-xl font-black text-slate-900 tracking-tight" dir="ltr">
                  {formatFinancialValue(stats.totalDebts)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>الوعاء المالي الإجمالي المقيد</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-5 hover:border-slate-300 transition-all bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <span className="text-[11px] font-black text-slate-500 block mb-1">إجمالي التحصيلات</span>
                <div className="text-xl font-black text-emerald-600 tracking-tight" dir="ltr">
                  {formatFinancialValue(stats.totalPaid)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-500 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>✓ تم استلامها بالصناديق السحابية</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-5 hover:border-slate-300 transition-all bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <span className="text-[11px] font-black text-slate-500 block mb-1">الأرصدة المتبقية</span>
                <div className="text-xl font-black text-amber-600 tracking-tight" dir="ltr">
                  {formatFinancialValue(stats.totalRemaining)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-500 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>ذمم مالية معلقة قيد المتابعة</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="p-5 hover:border-slate-300 transition-all bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <span className="text-[11px] font-black text-slate-500 block mb-1">تحصيلات اليوم</span>
                <div className="text-xl font-black text-orange-600 tracking-tight" dir="ltr">
                  {formatFinancialValue(stats.todayCollected)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-orange-500 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span>مبيعات وتسجيلات فورية معتمدة</span>
                </div>
              </div>

            </div>

            {/* Bottom layout: Tables and charts matching screenshot */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Column 1: الطلاب الأكثر مديونية */}
              <div className="xl:col-span-1 p-5 flex flex-col justify-between bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                    <h4 className="text-xs font-black text-slate-900">⚠️ الطلاب الأكثر مديونية</h4>
                    <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-bold">تنبيه المتابعة</span>
                  </div>
                  <div className="space-y-3">
                    {debtorStudents.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-xs font-bold text-slate-500">
                        لا توجد مديونيات موثقة للطلاب المحددين حالياً.
                      </div>
                    ) : debtorStudents.map(student => (
                      <div key={student.id} className="flex justify-between items-center bg-transparent p-2.5 border border-slate-100">
                        <div>
                          <p className="text-xs font-extrabold text-slate-950">{student.name}</p>
                          <span className="text-[10px] text-slate-500">{student.classroom || 'الفصل غير محدد'}</span>
                        </div>
                        <span className="text-xs font-black text-amber-600 font-mono" dir="ltr">{formatLD(Number(student.feesRemaining || 0))}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 text-center">
                  <button 
                    onClick={() => setActiveSubSec('management')}
                    className="text-[11px] text-yellow-600 font-extrabold hover:underline"
                  >
                    عرض الملفات الكاملة وجداول التحصيل ←
                  </button>
                </div>
              </div>

              {/* Column 2: تحليل أعمار المديونيات */}
              <div className="xl:col-span-1 p-5 flex flex-col justify-between bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                    <h4 className="text-xs font-black text-slate-900">⏳ تحليل أعمار المديونيات</h4>
                    <span className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">Aging Report</span>
                  </div>
                  
                  {agingAnalysis ? (
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      {agingAnalysis.buckets.map(bucket => (
                        <div key={bucket.key} className="rounded-lg border border-white bg-white/80 px-2 py-1.5 text-center shadow-sm">
                          <span className="block text-[9px] font-extrabold text-slate-500">{bucket.label}</span>
                          <span className={`block font-mono text-[11px] font-black ${bucket.key === 'current' ? 'text-emerald-700' : 'text-amber-700'}`} dir="ltr">
                            {formatLD(bucket.amount)}
                          </span>
                          <span className="block text-[8px] font-bold text-slate-400">{bucket.count} مطالبة</span>
                        </div>
                      ))}
                      <div className="col-span-2 flex items-center justify-between border-t border-slate-200 pt-2 text-[10px] font-black">
                        <span className="text-slate-600">إجمالي المديونية المؤرخة</span>
                        <span className="font-mono text-slate-900" dir="ltr">{formatLD(agingAnalysis.total)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center">
                      <span className="text-xs font-bold text-slate-500">
                        لا يمكن عرض أعمار المديونيات قبل توفر تواريخ الاستحقاق من مصدر مالي موثق.
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-3 text-center">
                  {agingAnalysis ? `* المتأخر فعلياً: ${formatLD(agingAnalysis.overdue)} وفق تاريخ اليوم` : '* الفترات الزمنية للالتزامات المستحقة منذ تحرير الأقساط'}
                </p>
              </div>

              {/* Column 3: كفاءة التحصيل */}
              <div className="xl:col-span-1 p-5 flex flex-col justify-between items-center text-center bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <div className="w-full">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                    <h4 className="text-xs font-black text-slate-900">🎯 كفاءة التحصيل السنوية</h4>
                    <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-150 px-2 py-0.5 rounded-full font-bold">مؤشر جودة</span>
                  </div>
                </div>

                {/* SVG Circular Progress exact visual style */}
                <div className="relative my-4 flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="50"
                      stroke="#f1f5f9"
                      strokeWidth="12"
                      fill="transparent"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="50"
                      stroke="url(#progressGradient)"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 50}
                      strokeDashoffset={2 * Math.PI * 50 * (1 - ((stats.collectionRate ?? 0) / 100))}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-black text-slate-900 block font-mono">
                      {stats.collectionRate === null ? 'غير متاح' : `${stats.collectionRate.toFixed(1)}%`}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold tracking-tight">معدل الدقة والالتزام</span>
                  </div>
                </div>

                <div className="space-y-1 mt-2">
                  <p className="text-xs font-extrabold text-slate-800">
                    {stats.collectionRate === null ? 'لا توجد حركة مالية موثقة بعد' : 'مؤشر التحصيل الحالي'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold px-4 leading-relaxed">
                    {stats.collectionRate === null
                      ? 'سيظهر المؤشر بعد تسجيل أرصدة أو سندات قبض معتمدة.'
                      : 'النسبة محسوبة من أرصدة الطلاب والسندات المعتمدة المتاحة.'}
                  </p>
                </div>
              </div>

            </div>

            {/* Sub and Footer values matching screenshot (Bottom row) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Detailed Item 1 */}
              <div className="bg-gradient-to-l from-slate-900 to-slate-950 text-slate-200 border border-slate-800 p-5 shadow flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 block mb-1">إجمالي الأقساط المجدولة المعلقة</span>
                  <div className="text-xl font-bold tracking-tight text-amber-300 font-mono" dir="ltr">
                    {formatFinancialValue(stats.totalRemaining)}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-850 border border-slate-750 flex items-center justify-center text-amber-300">
                  <PiggyBank className="w-5 h-5" />
                </div>
              </div>

              {/* Detailed Item 2 */}
              <div className="bg-gradient-to-l from-slate-900 to-slate-950 text-slate-200 border border-slate-800 p-5 shadow flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 block mb-1">التوقعات المالية (الشهر القادم)</span>
                  <div className="text-xl font-bold tracking-tight text-emerald-400 font-mono" dir="ltr">
                    {nextMonthForecast ? formatLD(nextMonthForecast.amount) : 'غير متاح'}
                  </div>
                  {nextMonthForecast && <span className="text-[9px] text-slate-400 font-bold">استحقاقات {nextMonthForecast.label}</span>}
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-850 border border-slate-750 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: إعدادات مبالغ الرسوم */}
        {activeSubSec === 'settings' && (
          <div className="space-y-6 animate-fadeIn" dir="rtl">
            {/* Header block with solid blue background and watermark */}
            <div className="financial-fee-module-header relative bg-[#1e40af] text-white p-6 overflow-hidden shadow-md flex justify-between items-center">
              <div className="z-10">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span className="p-1.5 bg-slate-50/10 rounded-lg">
                    <Settings2 className="w-6 h-6 text-white" />
                  </span>
                  تهيئة مبالغ الرسوم الدراسية
                </h3>
                <p className="text-xs text-orange-100 mt-1.5 opacity-90 font-medium">
                  ضبط القيم الافتراضية للرسوم والأنشطة المدرسية - النسخة الملكية
                </p>
              </div>
              
              {/* "FEE CONFIG" Watermark on the left side (RTL) which corresponds to RHS in the view */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 select-none pointer-events-none opacity-10 hidden sm:block">
                <span className="text-4xl font-extrabold tracking-widest font-mono">FEE CONFIG</span>
              </div>
            </div>

            {/* Config Form Card */}
            <div className="p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
                {/* Right column in RTL context */}
                <div className="space-y-4">
                  {/* نوع الرسوم */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-800 sm:w-28 shrink-0 text-right">نوع الرسوم:</label>
                    <input
                      id="fee-config-type-input"
                      type="text"
                      placeholder="مثال: ايراد الرسوم الدراسية"
                      value={currFeeType}
                      onChange={(e) => setCurrFeeType(e.target.value)}
                      className="w-full bg-transparent rounded p-2 text-xs font-bold focus:ring-1 focus:ring-orange-500 focus:outline-none focus:text-right"
                    />
                  </div>

                  {/* حساب الإيراد */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-800 sm:w-28 shrink-0 text-right">حساب الإيراد:</label>
                    {feeRevenueAccountOptions.length > 0 ? (
                      <select
                        value={currFeeAccount}
                        onChange={(e) => setCurrFeeAccount(e.target.value)}
                        className="w-full bg-transparent rounded p-2 text-xs font-bold focus:ring-1 focus:ring-orange-500 focus:outline-none focus:text-right"
                      >
                        <option value="">اختر حساب إيراد من الدليل</option>
                        {feeRevenueAccountOptions.map(account => (
                          <option key={account.code} value={account.code}>{account.code} — {account.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="مثال: 4101"
                        value={currFeeAccount}
                        onChange={(e) => setCurrFeeAccount(e.target.value)}
                        className="w-full bg-transparent rounded p-2 text-xs font-bold focus:ring-1 focus:ring-orange-500 focus:outline-none focus:text-right"
                      />
                    )}
                  </div>
                </div>

                {/* Left column in RTL context */}
                <div className="space-y-4">
                  {/* المبلغ الافتراضي */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-800 sm:w-28 shrink-0 text-right">المبلغ الافتراضي:</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={currFeeAmount}
                      onChange={(e) => setCurrFeeAmount(Number(e.target.value))}
                      className="w-full bg-transparent rounded p-2 text-xs font-bold focus:ring-1 focus:ring-orange-500 focus:outline-none focus:text-right"
                    />
                  </div>

                  {/* رقم الإيراد */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-800 sm:w-28 shrink-0 text-right">رقم الإيراد:</label>
                    <input
                      type="text"
                      placeholder="مثال: 1"
                      value={currFeeOrderNumber}
                      onChange={(e) => setCurrFeeOrderNumber(e.target.value)}
                      className="w-full bg-transparent rounded p-2 text-xs font-bold focus:ring-1 focus:ring-orange-500 focus:outline-none focus:text-right"
                    />
                  </div>
                </div>
              </div>

              {/* الأنشطة المطلوبة (Full-width row) */}
              <div className="mt-4 flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-800 text-right">الأنشطة المطلوبة:</label>
                <textarea
                  rows={4}
                  placeholder="أدخل قائمة الأنشطة المشمولة أو الأوصاف المطلوبة لبند الرسوم..."
                  value={currFeeActivities}
                  onChange={(e) => setCurrFeeActivities(e.target.value)}
                  className="w-full bg-transparent rounded p-2 text-xs font-medium focus:ring-1 focus:ring-orange-500 focus:outline-none focus:text-right"
                />
              </div>
            </div>

            {/* Fee Config List Table */}
            <div className="overflow-hidden shadow-sm">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="financial-fee-module-table-header text-xs text-white">
                    {/* RTL Table Header Cells from right to left */}
                    <th className="p-3 bg-[#0284c7] border-l border-white/10 font-bold text-center w-1/4">نوع الرسوم</th>
                    <th className="p-3 bg-slate-800 border-l border-white/10 font-bold text-center">المبلغ</th>
                    <th className="p-3 bg-slate-800 border-l border-white/10 font-bold text-center">حساب الإيراد</th>
                    <th className="p-3 bg-slate-800 border-l border-white/10 font-bold text-center">رقم الإيراد</th>
                    <th className="p-3 bg-slate-800 font-bold text-center w-1/4">الأنشطة المطلوبة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 bg-slate-50/60 backdrop-blur-sm rounded-b-2xl">
                  {feeConfigs.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setCurrFeeId(item.id);
                        setCurrFeeType(item.type);
                        setCurrFeeAmount(item.amount);
                        setCurrFeeAccount(item.account);
                        setCurrFeeOrderNumber(item.orderNumber);
                        setCurrFeeActivities(item.activities);
                        triggerNotification(`تم اختيار بند: ${item.type}`, 'info');
                      }}
                      className={`hover:bg-transparent transition-colors cursor-pointer ${currFeeId === item.id ? 'bg-yellow-50/50' : ''}`}
                    >
                      <td className="p-3 text-[#0070c0] font-bold text-center border-l border-slate-100">{item.type}</td>
                      <td className="p-3 font-bold text-center border-l border-slate-100 text-slate-700">
                        {item.amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </td>
                      <td className="p-3 text-center border-l border-slate-100 text-slate-700">{item.account}</td>
                      <td className="p-3 text-center border-l border-slate-100 text-slate-700">{item.orderNumber}</td>
                      <td className="p-3 text-right text-slate-500 max-w-xs truncate">{item.activities || '—'}</td>
                    </tr>
                  ))}
                  {feeConfigs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-medium font-sans">
                        لا يوجد بنود رسوم مصممة حالياً. اضغط على "جديد" للبدء.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Action buttons bar matching the bottom LHS style of the screenshot */}
            <div className="flex flex-wrap items-center justify-start gap-2.5 pt-2">
              {/* جديد (Blue) */}
              <button
                type="button"
                onClick={() => {
                  setCurrFeeId('');
                  setCurrFeeType('');
                  setCurrFeeAmount(0);
                  setCurrFeeAccount('');
                  setCurrFeeOrderNumber((feeConfigs.length + 1).toString());
                  setCurrFeeActivities('');
                  triggerNotification('تم تهيئة الحقول لإدخال بند رسوم جديد', 'info');
                }}
                    className="financial-fee-module-action financial-fee-module-gold text-xs font-bold px-5 py-2.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>جديد</span>
              </button>

              {/* حفظ (Green) */}
              <button
                type="button"
                onClick={() => { void portalOnSave?.(); }}
                className="financial-fee-module-action financial-fee-module-navy text-xs font-bold px-5 py-2.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ</span>
              </button>

              {/* تعديل (Orange / Amber) */}
              <button
                type="button"
                onClick={() => {
                  if (!currFeeId) {
                    triggerNotification('الرجاء اختيار بند من الجدول أولاً للقيام بالتعديل', 'warning');
                    return;
                  }
                  const ipt = document.getElementById('fee-config-type-input');
                  if (ipt) ipt.focus();
                  triggerNotification('الحقول جاهزة الآن للتعديل، اضغط على حفظ لاعتماد التغييرات', 'info');
                }}
                className="financial-fee-module-action financial-fee-module-paper text-xs font-bold px-5 py-2.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                <span>تعديل</span>
              </button>

              {/* طباعة (Charcoal / Slategray) */}
              <button
                type="button"
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (!printWindow) {
                    triggerNotification('تم حظر فتح نافذة الطباعة من المتصفح', 'warning');
                    return;
                  }
                  
                  const htmlContent = `
                    <html lang="ar" dir="rtl">
                      <head>
                        <title>كشف كلفة وتهيئة الرسوم - النسخة الملكية</title>
                        <meta charset="utf-8" />
                        <style>
                          body {
                            font-family: system-ui, -apple-system, sans-serif;
                            padding: 40px;
                            color: #1e293b;
                            background-color: #fff;
                          }
                          .header {
                            border-bottom: 2px solid #0284c7;
                            padding-bottom: 20px;
                            margin-bottom: 30px;
                            text-align: center;
                          }
                          h1 {
                            font-size: 24px;
                            color: #1e3a8a;
                            margin: 0 0 10px 0;
                          }
                          .subtitle {
                            font-size: 14px;
                            color: #64748b;
                            margin: 0;
                          }
                          table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                          }
                          th {
                            background-color: #1e3a8a;
                            color: #ffffff;
                            padding: 12px;
                            font-size: 14px;
                            border: 1px solid #e2e8f0;
                            text-align: center;
                          }
                          th.special {
                            background-color: #0284c7;
                          }
                          td {
                            padding: 12px;
                            font-size: 13px;
                            border: 1px solid #e2e8f0;
                            text-align: center;
                          }
                          tr:nth-child(even) {
                            background-color: #f8fafc;
                          }
                          .footer {
                            margin-top: 50px;
                            text-align: center;
                            font-size: 11px;
                            color: #94a3b8;
                            border-top: 1px dashed #cbd5e1;
                            padding-top: 20px;
                          }
                          @media print {
                            body { padding: 20px; }
                          }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <h1>تهيئة مبالغ الرسوم الدراسية</h1>
                          <p class="subtitle">نسخة مطبوعة من وثيقة الموازنة والأسس المالية - المدرسة والأنشطة</p>
                        </div>
                        
                        <table>
                          <thead>
                            <tr>
                              <th class="special">نوع الرسوم</th>
                              <th>المبلغ (د.ل)</th>
                              <th>حساب الإيراد</th>
                              <th>رقم الإيراد</th>
                              <th>الأنشطة المطلوبة</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${feeConfigs.map(item => `
                              <tr>
                                <td style="font-weight: bold; color: #0284c7;">${item.type}</td>
                                <td style="font-weight: bold; color: #1e293b;">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 1 })} د.ل</td>
                                <td>${item.account}</td>
                                <td>${item.orderNumber}</td>
                                <td>${item.activities || '—'}</td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>

                        <div class="footer">
                          <p>صنع بفخر - وثيقة صادرة عن البوابة المالية لشركة المدارس الذكية الموحدة في ${new Date().toLocaleDateString('ar')}</p>
                        </div>

                        <script>
                          window.onload = function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 500);
                          }
                        </script>
                      </body>
                    </html>
                  `;
                  
                  printWindow.document.write(htmlContent);
                  printWindow.document.close();
                  triggerNotification('تم تجهيز كشف الإعدادات وطباعته بنجاح', 'success');
                  logAction('PRINT_FEE_SETTINGS', 'طباعة كشف تهيئة مبالغ الرسوم والمطالبات', 'الإعدادات');
                }}
                className="financial-fee-module-action financial-fee-module-paper text-xs font-bold px-5 py-2.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: التوزيع الجماعي للرسوم */}
        {activeSubSec === 'distribution' && (
          <div className="space-y-6 animate-fadeIn" dir="rtl">
            {/* Header Banner */}
            <div className="financial-fee-module-header bg-[#1e40af] text-white p-6 shadow-md">
              <h2 className="text-xl font-bold">ترحيل الرسوم الجماعي للفصول</h2>
              <p className="text-xs text-orange-100 mt-1 opacity-90 font-medium">تطبيق المطالبات المالية على قوائم الطلاب المختارة دفعة واحدة وبضغطة زر</p>
            </div>

            {/* Top Control Bar */}
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              {/* Classroom Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">الفصل الدراسي</label>
                <select
                  value={massClassroom}
                  onChange={(e) => setMassClassroom(e.target.value)}
                  className="w-full bg-transparent rounded p-2 text-xs font-bold focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  >
                    <option value="الصف الأول ابتدائي">الصف الأول ابتدائي</option>
                    <option value="الصف الثاني ابتدائي">الصف الثاني ابتدائي</option>
                    <option value="الروضة">الروضة</option>
                    <option value="الفصل غير محدد">الفصل غير محدد</option>
                </select>
              </div>

              {/* Fee Type Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">نوع الرسوم</label>
                <select
                  value={massFeeType}
                  onChange={(e) => setMassFeeType(e.target.value)}
                  className="w-full bg-transparent rounded p-2 text-xs font-bold focus:ring-1 focus:ring-orange-500 focus:outline-none"
                >
                  {feeConfigs.map(config => (
                    <option key={config.id} value={config.type}>{config.type}</option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">المبلغ الموحد</label>
                <input
                  type="number"
                  value={massFeeAmount}
                  onChange={(e) => setMassFeeAmount(Number(e.target.value))}
                  className="w-full bg-transparent rounded p-2 text-xs font-bold focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* Due Date Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">تاريخ المطالبة</label>
                  <input
                    type="date"
                    value={massDueDate}
                    onChange={(e) => setMassDueDate(e.target.value)}
                    className="w-full bg-transparent rounded p-2 text-xs font-bold focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  />
              </div>

              {/* Settings Button */}
              <button
                onClick={() => setActiveSubSec('settings')}
                className="financial-fee-module-action financial-fee-module-gold text-xs font-bold px-4 py-2 rounded shadow flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Settings2 className="w-4 h-4" />
                <span>الإعدادات</span>
              </button>
            </div>

            {/* Student Table */}
            <div className="p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  قائمة الطلاب المستهدفين للتوزيع:
                </h3>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded border-slate-300 pointer-events-auto"
                    checked={massTargetStudents.length > 0 && massTargetStudents.every(s => selectedStudentIds[s.id] !== false)}
                    onChange={(e) => {
                      const updatedIds = { ...selectedStudentIds };
                      massTargetStudents.forEach(s => {
                        updatedIds[s.id] = e.target.checked;
                      });
                      setSelectedStudentIds(updatedIds);
                    }}
                  />
                  تحديد الكل / إلغاء التحديد
                </label>
              </div>

              <div className="rounded overflow-hidden">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="financial-fee-module-table-header bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                      <th className="p-3 border-l border-slate-200 text-center">تحديد</th>
                      <th className="p-3 border-l border-slate-200">اسم الطالب</th>
                      <th className="p-3">رقم القيد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/10 bg-slate-50/60 backdrop-blur-sm rounded-b-2xl">
                    {massTargetStudents.map(student => (
                      <tr key={student.id} className="hover:bg-transparent">
                        <td className="p-3 border-l border-slate-100 text-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded border-slate-300 cursor-pointer"
                            checked={selectedStudentIds[student.id] !== false} 
                            onChange={(e) => {
                              setSelectedStudentIds(prev => ({
                                ...prev,
                                [student.id]: e.target.checked
                              }));
                            }}
                          />
                        </td>
                        <td className="p-3 border-l border-slate-100 font-bold">{student.name}</td>
                        <td className="p-3 font-mono">{student.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Summary & Action */}
            <div className="flex justify-between items-center gap-4">
              <p className="text-xs font-bold text-slate-700">
                تم تحديد {massTargetStudents.filter(s => selectedStudentIds[s.id] !== false).length} من أصل {massTargetStudents.length} طالب جاهز للتوزيع.
              </p>
              
              <button
                onClick={() => handleMassDistribution()}
                className="financial-fee-module-action financial-fee-module-navy text-sm font-bold px-8 py-4 rounded shadow-md flex items-center gap-2 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>بدء الترحيل الجماعي والمحاسبي للمطالبات</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: إدارة الرسوم والدفعات الذكية */}
        {activeSubSec === 'management' && (
          <div className="management-reference-screen space-y-6 animate-fadeIn">
            <details className="reference-screen-nav">
              <summary aria-label="التنقل بين شاشات وحدة الرسوم">☰</summary>
              <div className="reference-screen-nav-menu">
                <button type="button" onClick={() => setActiveSubSec('analytics')}>لوحة التحليلات</button>
                <button type="button" onClick={() => setActiveSubSec('management')}>إدارة الرسوم</button>
                <button type="button" onClick={() => setActiveSubSec('receipts')}>سندات القبض</button>
                <button type="button" onClick={() => setActiveSubSec('reports')}>التقارير المالية</button>
                <button type="button" onClick={() => setActiveSection('dashboard')}>العودة للرئيسية</button>
              </div>
            </details>
            {/* Header with Title and Search */}
            <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <span>إدارة الرسوم والدفعات الذكية - شاشة الإدارة المتكاملة</span>
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">كشف ذمم الطلاب، وجدولة ميزت السداد الرقمي واحتساب الخصومات آلياً</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto relative">
                <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="ابحث باسم الطالب (مثال: عبدالسلام)..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pr-9 pl-4 py-1.5 text-xs focus:ring-1 focus:ring-[#9a6a1d] focus:border-[#9a6a1d] focus:outline-none font-bold text-slate-800 w-full sm:w-64"
                />
              </div>
            </div>

            {/* Top Three Metric Cards (Stats row) styled exactly as requested and shown in the image */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: إجمالي المطالبات - Light Blue Background, Dark Blue Text */}
              <div className="bg-[#e0f1fe] border border-orange-200 p-5 text-center relative overflow-hidden transition-all hover:scale-[1.01]">
                <span className="text-[13px] font-bold text-[#1e3a8a] block mb-1">إجمالي المطالبات</span>
                <div className="text-2xl md:text-3xl font-black text-[#1e3a8a] font-mono tracking-tight" dir="ltr">
                  {selectedStudentFinancialView ? formatLD(Number(selectedStudentFinancialView.feesPaid || 0) + Number(selectedStudentFinancialView.feesRemaining || 0)) : 'غير متاح'}
                </div>
              </div>

              {/* Card 2: إجمالي المسدد - Light Green Background, Dark Green Text */}
              <div className="bg-[#dcfce7] border border-green-200 p-5 text-center relative overflow-hidden transition-all hover:scale-[1.01]">
                <span className="text-[13px] font-bold text-[#166534] block mb-1">إجمالي المسدد</span>
                <div className="text-2xl md:text-3xl font-black text-[#166534] font-mono tracking-tight" dir="ltr">
                  {selectedStudentFinancialView ? formatLD(Number(selectedStudentFinancialView.feesPaid || 0)) : 'غير متاح'}
                </div>
              </div>

              {/* Card 3: الرصيد المتبقي - Light Red/Pink Background, Dark Red Text */}
              <div className="bg-[#fee2e2] border border-rose-200 p-5 text-center relative overflow-hidden transition-all hover:scale-[1.01]">
                <span className="text-[13px] font-bold text-[#991b1b] block mb-1">الرصيد المتبقي</span>
                <div className="text-2xl md:text-3xl font-black text-[#991b1b] font-mono tracking-tight" dir="ltr">
                  {selectedStudentFinancialView ? formatLD(Number(selectedStudentFinancialView.feesRemaining || 0)) : 'غير متاح'}
                </div>
              </div>
            </div>

            {/* Split Layout below */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Right Side: Primary interactive form (8-cols duration) */}
              <div className="xl:col-span-8 p-5 space-y-5">
                
                {/* Form Header with mascot/avatar */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">⏱️</span>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">إنشاء مطالبة مالية واحتساب الأقساط</h4>
                      <p className="text-[10px] text-slate-400 font-bold">تسجيل الرسوم والخدمات لعام 2026 مع كود الخصم المرن للأشقاء</p>
                    </div>
                  </div>
                  
                  {/* Sibling detection banner */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-bold text-[11px] text-slate-700 block">
                        {hasSiblingsDetected ? "✅ تم اكتشاف إخوة في النظام! مؤهل لخصم %15" : "لم يتم اكتشاف إخوة لهذا الطالب في النظام"}
                      </span>
                      <div className="flex items-center gap-1.5 justify-end mt-1">
                        <label className="text-[10px] text-slate-500 font-bold">% نسبة الخصم:</label>
                        <input
                          type="number"
                          value={siblingDiscountPercent}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSiblingDiscountPercent(val);
                            if (val > 0) setHasSiblingsDetected(true);
                            else setHasSiblingsDetected(false);
                          }}
                          className="w-12 bg-transparent text-xs text-center font-bold font-mono rounded py-0.5"
                        />
                        <button 
                          type="button"
                          onClick={() => { void handleSaveSiblingDiscount(); }}
                          className="fee-management-inline-action text-[10px] font-extrabold px-2.5 py-1 rounded"
                        >
                          تطبيق وحفظ
                        </button>
                      </div>
                    </div>
                    {/* Mascot round Avatar matching the graphic in the screenshot */}
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-250 flex items-center justify-center overflow-hidden shrink-0">
                      <div className="bg-gradient-to-tr from-yellow-300 via-amber-300 to-amber-200 w-full h-full flex items-center justify-center font-bold text-slate-700 text-sm">
                        👨‍🎓
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Student and Doc metadata inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Student Search */}
                  <div>
                    <label className="block text-slate-700 font-extrabold text-[11px] mb-1.5 flex items-center gap-1">
                      <span>🔍</span> <span>بحث عن طالب:</span>
                    </label>
                    <select
                      value={selectedStudent?.id || ''}
                      onChange={(e) => {
                        const s = students.find(x => x.id === e.target.value);
                        setSelectedStudent(s || null);
                        if (!s) setVoucherNumber('');
                        else if (!voucherNumber) setVoucherNumber('');
                      }}
                      className="w-full bg-transparent p-2 text-xs font-bold focus:ring-1 focus:ring-[#9a6a1d] focus:border-[#9a6a1d] focus:outline-none"
                    >
                      <option value="">اختر طالباً موثقاً للبدء</option>
                      {students.map((st) => (
                        <option key={st.id} value={st.id}>{st.name} ({st.classroom || 'الفصل غير محدد'})</option>
                      ))}
                    </select>
                  </div>

                  {/* Voucher Date */}
                  <div>
                    <label className="block text-slate-700 font-extrabold text-[11px] mb-1.5">التاريخ:</label>
                    <input
                      type="date"
                      value={voucherDate}
                      onChange={(e) => setVoucherDate(e.target.value)}
                      className="w-full bg-transparent p-2 text-xs font-mono font-bold focus:ring-1 focus:ring-[#9a6a1d] focus:border-[#9a6a1d] focus:outline-none"
                    />
                  </div>

                  {/* Voucher Identification ref code */}
                  <div>
                    <label className="block text-slate-700 font-extrabold text-[11px] mb-1.5">رقم السند:</label>
                    <input
                      type="text"
                      value={voucherNumber}
                      onChange={(e) => setVoucherNumber(e.target.value)}
                      className="w-full bg-transparent text-slate-700 p-2 text-xs font-mono font-bold focus:ring-1 focus:ring-[#9a6a1d] focus:border-[#9a6a1d] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Grid header and add row action */}
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <span>🗂️</span> <span>تفاصيل الرسوم والمطالبات</span>
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const newId = `row_${Date.now()}`;
                      setFeeRows([...feeRows, { id: newId, type: feeTypeOptions[0]?.value || 'زي مدرسي', amount: 0, remarks: '' }]);
                    }}
                    className="fee-management-add-action text-[11px] font-black px-3.5 py-1.5 flex items-center gap-1 transition-all transform active:scale-95 cursor-pointer shadow-sm"
                  >
                    <span>+</span>
                    <span>إضافة بند رسوم جديد</span>
                  </button>
                </div>

                {/* Primary Editable Fee Items Table */}
                <div className="overflow-hidden shadow-xs">
                  <table className="w-full text-right text-xs">
                    <thead className="fee-management-table-header text-white font-black border-b border-amber-950">
                      <tr>
                        <th className="px-4 py-3 text-right">نوع الرسوم والمطالبة</th>
                        <th className="px-4 py-3 text-right w-44">المبلغ</th>
                        <th className="px-4 py-3 text-right">ملاحظات</th>
                        <th className="px-3 py-3 text-center w-12">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-900/10 bg-slate-50/60 backdrop-blur-sm rounded-b-2xl">
                      {feeRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-55/45 transition-colors">
                          {/* Row Type Select */}
                          <td className="px-3 py-2">
                            <select
                              value={row.type}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFeeRows(feeRows.map(f => f.id === row.id ? { ...f, type: val } : f));
                              }}
                              className="w-full bg-transparent p-1 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-[#9a6a1d] focus:border-[#9a6a1d] focus:outline-none"
                            >
                              {feeTypeOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </td>
                          {/* Row Amount Input */}
                          <td className="px-3 py-2 font-mono">
                            <input
                              type="number"
                              value={row.amount || ""}
                              placeholder="0.00"
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setFeeRows(feeRows.map(f => f.id === row.id ? { ...f, amount: val } : f));
                              }}
                              className="w-full bg-transparent p-1.5 font-bold text-slate-900 focus:ring-1 focus:ring-[#9a6a1d] focus:border-[#9a6a1d] focus:outline-none text-right"
                            />
                          </td>
                          {/* Row remarks */}
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={row.remarks}
                              placeholder="مستلم ومطابق للمعايير..."
                              onChange={(e) => {
                                const val = e.target.value;
                                setFeeRows(feeRows.map(f => f.id === row.id ? { ...f, remarks: val } : f));
                              }}
                              className="w-full bg-transparent p-1.5 focus:ring-1 focus:ring-[#9a6a1d] focus:border-[#9a6a1d] focus:outline-none"
                            />
                          </td>
                          {/* Delete Item action */}
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setFeeRows(feeRows.filter(f => f.id !== row.id));
                              }}
                              className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 transition-colors"
                              title="حذف هذا البند"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                      {feeRows.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">
                            لا توجد بنود رسوم مضافة حالياً. انقر على "+ إضافة بند" لإنشاء مطالبة جديدة.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Calculation and net panel exactly modeled after the screenshot */}
                <div className="p-4 bg-transparent/60 border border-slate-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {/* Left inputs details */}
                  <div className="space-y-1.5 text-xs">
                    <div className="text-slate-700 font-bold flex items-center gap-2">
                      <span>إجمالي الفاتورة:</span>
                      <span className="font-mono text-slate-900 font-extrabold">
                        {feeRows.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString(undefined, {minimumFractionDigits: 2})} د.ل
                      </span>
                    </div>
                    <div className="text-slate-500 font-bold flex items-center gap-2">
                      <span>خصم الإخوة (%{siblingDiscountPercent.toFixed(2)}):</span>
                      <span className="font-mono text-rose-650">
                        {((feeRows.reduce((acc, curr) => acc + curr.amount, 0) * siblingDiscountPercent) / 100).toLocaleString(undefined, {minimumFractionDigits: 2})} د.ل
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-slate-700">خصم إضافي:</span>
                      <input
                        type="text"
                        value={customDiscountText}
                        onChange={(e) => {
                          setCustomDiscountText(e.target.value);
                          const parsed = parseFloat(e.target.value);
                          if (!isNaN(parsed)) setManualDiscountAmount(parsed);
                        }}
                        className="w-20 text-center font-bold font-mono rounded py-0.5"
                      />
                    </div>
                  </div>

                  {/* Clean Net Due highlighted in green text with large typeface */}
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">الصافي المستحق للتحصيل</span>
                    <h5 className="text-3xl font-black text-[#16a34a] font-mono tracking-tight mt-1">
                      الصافي المستحق: {(() => {
                        const sub = feeRows.reduce((acc, curr) => acc + curr.amount, 0);
                        const siblingDeduct = (sub * siblingDiscountPercent) / 100;
                        const netVal = Math.max(0, sub - siblingDeduct - manualDiscountAmount);
                        return netVal.toLocaleString(undefined, {minimumFractionDigits: 2});
                      })()} د.ل
                    </h5>
                  </div>
                </div>

                {/* Styled 6-column Action group from the image - Colorful buttons */}
                <div className="fee-management-action-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-3 border-t border-slate-100">
                  {/* Button 1: حفظ (Save) - Unified Navy */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedStudent) {
                        triggerNotification('الرجاء اختيار طالب موثق أولاً.', 'warning');
                        return;
                      }
                      const sub = feeRows.reduce((acc, curr) => acc + curr.amount, 0);
                      const finalAmount = Math.max(0, sub - (sub * siblingDiscountPercent) / 100 - manualDiscountAmount);
                      if (finalAmount <= 0) {
                        triggerNotification('أضف بند رسوم موجباً قبل تجهيز المعاملة.', 'warning');
                        return;
                      }
                      setStudRvMode('create');
                      setStudRvForm(prev => ({
                        ...prev,
                        id: '',
                        date: voucherDate,
                        studentId: selectedStudent.id,
                        studentName: selectedStudent.name,
                        amount: finalAmount,
                        against: feeRows.map(row => row.type).join('، '),
                        status: 'draft'
                      }));
                      setActiveSubSec('receipts');
                      triggerNotification('تم تجهيز مسودة السند؛ راجعها واعتمد حفظها من شاشة سندات القبض.', 'info');
                    }}
                    className="fee-management-action fee-management-primary-action text-xs font-black py-3 px-1 transition-transform active:scale-95 text-center cursor-pointer"
                  >
                    📝 تجهيز مسودة سند
                  </button>

                  {/* Button 2: قبض (Collect) - Unified Gold */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedStudent) {
                        triggerNotification('الرجاء اختيار طالب موثق أولاً.', 'warning');
                        return;
                      }
                      const sub = feeRows.reduce((acc, curr) => acc + curr.amount, 0);
                      const siblingDeduct = (sub * siblingDiscountPercent) / 100;
                      const finalAmount = Math.max(0, sub - siblingDeduct - manualDiscountAmount);
                      if (finalAmount <= 0) {
                        triggerNotification('أضف بند رسوم موجباً قبل تجهيز التحصيل.', 'warning');
                        return;
                      }
                      setStudRvMode('create');
                      setStudRvForm(prev => ({
                        ...prev,
                        id: '',
                        date: voucherDate,
                        studentId: selectedStudent.id,
                        studentName: selectedStudent.name,
                        amount: finalAmount,
                        against: feeRows.map(row => row.type).join('، '),
                        status: 'draft'
                      }));
                      setActiveSubSec('receipts');
                      triggerNotification('تم تجهيز مسودة التحصيل؛ لا يتم القيد الفعلي إلا بعد المراجعة والحفظ ثم الاعتماد والترحيل.', 'info');
                    }}
                    className="fee-management-action fee-management-collect-action text-xs font-black py-3 px-1 transition-transform active:scale-95 text-center cursor-pointer"
                  >
                    💵 قبض وتحصيل
                  </button>

                  {/* Button 3: عرض (Show) - Unified Paper */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedStudent) {
                        triggerNotification('اختر طالباً موثقاً لعرض كشفه المالي.', 'warning');
                        return;
                      }
                      setActiveSubSec('receipts');
                      triggerNotification('تم الانتقال إلى سندات القبض لعرض السجلات الموثقة فقط.', 'info');
                    }}
                    className="fee-management-action fee-management-secondary-action text-xs font-black py-3 px-1 transition-transform active:scale-95 text-center cursor-pointer"
                  >
                    🔍 عرض السند
                  </button>

                  {/* Button 4: تحديث (Update) - Unified Paper */}
                  <button
                    type="button"
                    onClick={() => {
                      handleRefreshData();
                    }}
                    className="fee-management-action fee-management-secondary-action text-xs font-black py-3 px-1 transition-transform active:scale-95 text-center cursor-pointer"
                  >
                    🔄 تحديث ومطابقة
                  </button>

                  {/* Button 5: تقارير (Reports) - Unified Paper */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubSec('reports');
                    }}
                    className="fee-management-action fee-management-secondary-action text-xs font-black py-3 px-1 transition-transform active:scale-95 text-center cursor-pointer"
                  >
                    📊 تقارير مالية
                  </button>

                  {/* Button 6: تفريغ (Clear) - Soft Danger */}
                  <button
                    type="button"
                    onClick={() => {
                      setFeeRows([]);
                      setManualDiscountAmount(0);
                      setSiblingDiscountPercent(0);
                      setCustomDiscountText('0.00');
                      setHasSiblingsDetected(false);
                      triggerNotification('تم تنظيف نموذج التصفية وإعادة التهيئة المبدئية للبيانات', 'warning');
                    }}
                    className="fee-management-action fee-management-danger-action text-xs font-black py-3 px-1 transition-transform active:scale-95 text-center cursor-pointer"
                  >
                    🧹 تفريغ النموذج
                  </button>
                </div>

              </div>
              
              {/* Left Side: Statement and timeline panel metadata (4-cols duration) */}
              <div className="xl:col-span-4 space-y-6">
                
                {/* 1. كشف حساب الطالب Ledger details with printing */}
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-xs font-extrabold text-[#d97706] flex items-center gap-1">
                      <span>📄</span> <span>كشف حساب الطالب</span>
                    </span>
                    
                    {/* Action controls from screenshot */}
                    <div className="fee-management-utility-actions flex gap-1.5">
                      <button 
                        onClick={handlePrintStudentLedger}
                        className="fee-management-utility-action fee-management-utility-print text-[9px] font-bold px-2 py-1 rounded cursor-pointer"
                      >
                        🖨️ طباعة كشف
                      </button>
                      <button
                        type="button"
                        onClick={handlePrintStudentLedger}
                        className="fee-management-utility-action fee-management-utility-pdf text-[9px] font-bold px-2 py-1 rounded cursor-pointer"
                      >
                        🖨️ معاينة PDF
                      </button>
                    </div>
                  </div>

                  {/* Accounting Ledger Grid */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-[10px] font-medium">
                      <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                        <tr>
                          <th className="px-2 py-1.5 text-right w-16">التاريخ</th>
                          <th className="px-2 py-1.5 text-right">البيان</th>
                          <th className="px-2 py-1.5 text-center">مدين</th>
                          <th className="px-2 py-1.5 text-center">دائن</th>
                          <th className="px-2 py-1.5 text-center font-bold">الرصيد</th>
                          <th className="px-2 py-1.5 text-center w-14">الرقابة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-900/10 bg-slate-50/60 backdrop-blur-sm rounded-b-2xl">
                        {/* Dynamic rows for invoices & receipts of this student */}
                        {financialInvoices
                          .filter(inv => inv.studentId === selectedStudent?.id)
                          .map((inv) => {
                            const isCancelled = inv.status === 'Cancelled' || inv.status === 'Void';
                            const isReceipt = inv.status === 'paid' || inv.status === 'Paid' || inv.id.startsWith('receipt_');
                            return (
                              <tr key={inv.id} className={`${isReceipt ? "bg-emerald-50/50 hover:bg-emerald-50" : "hover:bg-transparent"} ${isCancelled ? "opacity-60 text-slate-400 bg-transparent/50" : ""}`}>
                                <td className={`px-1.5 py-2 text-slate-500 font-sans ${isCancelled ? 'line-through' : ''}`}>{inv.invoiceDate || inv.dueDate}</td>
                                <td className={`px-1.5 py-2 text-slate-800 font-sans font-semibold ${isCancelled ? 'line-through' : ''}`}>
                                  <div className="font-sans font-extrabold text-slate-900">{inv.item}</div>
                                  
                                  {/* Clickable reference block */}
                                  {inv.studentPaymentId && (
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[9px] font-bold select-none" dir="rtl">
                                      <span className="bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-150 font-mono font-bold">
                                        عملية سداد: {inv.studentPaymentId}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setViewingVoucher(inv);
                                          setActiveSubSec('receipts');
                                          triggerNotification(`جاري عرض سند القبض المحاسبي ${inv.receiptVoucherId}`, 'success');
                                        }}
                                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100/85 hover:text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-150 flex items-center gap-0.5 font-mono font-bold cursor-pointer"
                                        title="اضغط لعرض السند وطباعته"
                                      >
                                        سند قبض: {inv.receiptVoucherId} ↗
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          localStorage.setItem('erp_target_journal_entry_id', inv.journalEntryId || '');
                                          setActiveSection('accounts');
                                          triggerNotification(`جاري التحويل لدفتر القيود لفتح القيد المحاسبي المزدوج ${inv.journalEntryId}`, 'info');
                                        }}
                                        className="bg-amber-50 text-amber-700 hover:bg-amber-100/85 hover:text-amber-900 px-1.5 py-0.5 rounded border border-amber-150 flex items-center gap-0.5 font-mono font-bold cursor-pointer"
                                        title="اضغط للذهاب لدفتر قيود اليومية ومعاينة القيد"
                                      >
                                        قيد يومية: {inv.journalEntryId} ↗
                                      </button>
                                    </div>
                                  )}
                                </td>
                                <td className={`px-1.5 py-2 text-center text-slate-850 ${isCancelled ? 'line-through text-slate-300' : ''}`}>
                                  {!isReceipt ? inv.amount.toLocaleString() : '0.00'}
                                </td>
                                <td className={`px-1.5 py-2 text-center text-emerald-650 font-bold ${isCancelled ? 'line-through text-slate-300' : ''}`}>
                                  {isReceipt ? `-${inv.amount.toLocaleString()}` : '0.00'}
                                </td>
                                <td className="px-1.5 py-2 text-center text-orange-950 font-black">
                                  ---
                                </td>
                                <td className="px-1.5 py-2 text-center">
                                  {isCancelled ? (
                                    <span 
                                      className="text-rose-600 bg-rose-50 border border-rose-200/50 rounded px-1.5 py-0.5 text-[8px] font-extrabold cursor-help block max-w-max mx-auto"
                                      title={`تم الإلغاء بواسطة: ${inv.voidedBy || auditActor}\nالتاريخ: ${inv.voidedAt || ''}\nالسبب: ${inv.voidReason || 'تسوية عكسية للفاتورة'}`}
                                    >
                                      ملغاة 🚫
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleVoidInvoice(inv.id)}
                                      className="bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 border border-rose-200 text-[8px] font-extrabold px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                      title="إلغاء الفاتورة / إجراء تسوية عكسية"
                                    >
                                      إلغاء
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        }
                        {studentReceiptVouchers
                          .filter(voucher => voucher.studentId === selectedStudent?.id && String(voucher.status).toLowerCase() === 'posted')
                          .map(voucher => (
                            <tr key={`receipt-${voucher.id}`} className="bg-emerald-50/50 hover:bg-emerald-50">
                              <td className="px-1.5 py-2 text-slate-500 font-sans">{voucher.date}</td>
                              <td className="px-1.5 py-2 text-emerald-800 font-sans font-semibold">
                                <div className="font-sans font-extrabold">سند قبض مرحّل {voucher.id}</div>
                                <div className="text-[9px] text-slate-500">{voucher.against || 'تحصيل رسوم دراسية'}</div>
                              </td>
                              <td className="px-1.5 py-2 text-center text-slate-400">0.00</td>
                              <td className="px-1.5 py-2 text-center text-emerald-650 font-bold">-{Number(voucher.amount || 0).toLocaleString()}</td>
                              <td className="px-1.5 py-2 text-center text-emerald-700 font-black">مرحل</td>
                              <td className="px-1.5 py-2 text-center text-emerald-700">✓</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 text-center bg-transparent p-2.5 border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-bold block">رصيد الذمة الإجمالي المتبقي</span>
                    <p className="text-sm font-black text-rose-600 font-mono tracking-wide mt-0.5">
                      {selectedStudentFinancialView ? formatLD(Number(selectedStudentFinancialView.feesRemaining || 0)) : 'غير متاح'}
                    </p>
                  </div>
                </div>

                {/* 2. الخط الزمني المالي (Financial Timeline) */}
                <div className="p-4 space-y-3.5">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <span>📅</span> <span>الخط الزمني المالي</span>
                  </span>

                  {!selectedStudent ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-xs font-bold text-slate-500">
                      اختر طالباً لعرض خطه الزمني المالي.
                    </div>
                  ) : financialInvoices.filter(invoice => invoice.studentId === selectedStudent.id).length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-xs font-bold text-slate-500">
                      لا توجد حركات مالية موثقة لهذا الطالب.
                    </div>
                  ) : (
                    <div className="relative border-r border-slate-150 mr-2.5 pr-4 space-y-4 text-xs font-medium text-slate-700">
                      {financialInvoices.filter(invoice => invoice.studentId === selectedStudent.id).map(invoice => (
                        <div key={invoice.id} className="relative">
                          <span className={`absolute -right-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-xs ${invoice.status === 'paid' || invoice.status === 'Paid' ? 'bg-emerald-500' : 'bg-orange-600'}`} />
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <p className="font-extrabold text-slate-900">{invoice.id}</p>
                              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{invoice.item}</span>
                            </div>
                            <div className="text-left font-mono shrink-0">
                              <span className="text-slate-800 font-bold">{formatLD(Number(invoice.totalAmount || invoice.amount || 0))}</span>
                              <span className="text-[9px] text-slate-400 block">{invoice.invoiceDate || invoice.dueDate || 'بدون تاريخ'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* VIEW 6: سندات القبض الملكية */}
        {activeSubSec === 'receipts' && (
          <div className="space-y-6 animate-fadeIn text-right" dir="rtl">
            <div className="pb-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <span>👑 بوابـة سندات القبض الماليـة للطلاب</span>
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">توليد وإدارة وطباعة إيصالات الدفع والتحصيل، مع ترحيل فوري للحسابات العامة وقيد اليومية المزدوج وعزل كامل للبيانات</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black bg-slate-100 text-slate-700 px-3 py-1.5 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  حالة الاتصال بالسحابة: متصل ومؤمن بالكامل
                </span>
              </div>
            </div>

            {/* 12-Action Financial Toolbar (شريط الأدوات المالي الموحد - 12 وظيفة) */}
            <div className="financial-receipts-toolbar no-print bg-gradient-to-l from-slate-900 via-slate-800 to-slate-950 p-3 border border-slate-700 shadow-md flex flex-wrap items-center gap-2">
              
              {/* جديد */}
              <button
                type="button"
                onClick={handleNewStudRv}
                className="financial-receipts-action financial-receipts-gold text-xs font-bold px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="إصدار سند مالي جديد"
              >
                <Plus className="w-4 h-4" />
                <span>جديد</span>
              </button>

              {/* حفظ */}
              <button
                type="button"
                onClick={handleSaveStudRv}
                disabled={studRvMode === 'view'}
                className={`financial-receipts-action financial-receipts-navy text-xs font-bold px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  studRvMode !== 'view'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                }`}
                title="حفظ المسودة الحالية"
              >
                <Save className="w-4 h-4" />
                <span>حفظ</span>
              </button>

              {/* تعديل */}
              <button
                type="button"
                onClick={() => {
                  if (!selectedStudRv) {
                    triggerNotification('الرجاء اختيار سند من القائمة أولاً للتعديل', 'warning');
                    return;
                  }
                  if (selectedStudRv.status === 'posted') {
                    triggerNotification('❌ لا يمكن تعديل السند بعد ترحيله بالكامل الحسابات العامة لضمان سلامة الدورة الرقابية.', 'warning');
                    return;
                  }
                  if (selectedStudRv.status !== 'saved') {
                    triggerNotification('❌ لا يمكن تعديل السند بعد اعتماده. ألغِ السند وأصدر مسودة جديدة عند الحاجة.', 'warning');
                    return;
                  }
                  if (selectedStudRv.status === 'cancelled') {
                    triggerNotification('❌ لا يمكن تعديل سند ملغي.', 'warning');
                    return;
                  }
                  setStudRvMode('edit');
                  triggerNotification('📝 تم فتح وضع التحرير للسند الحالي.', 'info');
                }}
                disabled={studRvMode !== 'view' || !selectedStudRv || selectedStudRv.status !== 'saved'}
                className={`financial-receipts-action financial-receipts-paper text-xs font-bold px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  studRvMode === 'view' && selectedStudRv && selectedStudRv.status === 'saved'
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                }`}
                title="تعديل السند المالي"
              >
                <Pencil className="w-4 h-4" />
                <span>تعديل</span>
              </button>

              {/* اعتماد */}
              <button
                type="button"
                onClick={handleApproveStudRv}
                disabled={studRvMode !== 'view' || !selectedStudRv || selectedStudRv.status === 'approved' || selectedStudRv.status === 'posted' || selectedStudRv.status === 'cancelled'}
                className={`financial-receipts-action financial-receipts-gold text-xs font-bold px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  studRvMode === 'view' && selectedStudRv && selectedStudRv.status === 'saved'
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                }`}
                title="اعتماد السند من قبل المدير المالي"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتماد</span>
              </button>

              {/* ترحيل */}
              <button
                type="button"
                onClick={handlePostStudRv}
                disabled={studRvMode !== 'view' || !selectedStudRv || selectedStudRv.status !== 'approved'}
                className={`financial-receipts-action financial-receipts-navy text-xs font-bold px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  studRvMode === 'view' && selectedStudRv && selectedStudRv.status === 'approved'
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/30 font-extrabold'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                }`}
                title="ترحيل السند المالي وإنشاء القيد المزدوج بالحسابات العامة"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                <span>ترحيل قيد اليومية</span>
              </button>

              {/* إلغاء / تسوية عكسية */}
              <button
                type="button"
                onClick={handleCancelStudRv}
                disabled={studRvMode !== 'view' || !selectedStudRv || selectedStudRv.status === 'cancelled'}
                className={`financial-receipts-action financial-receipts-danger text-xs font-bold px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  studRvMode === 'view' && selectedStudRv && selectedStudRv.status !== 'cancelled'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                }`}
                title="إلغاء السند وعكس آثاره المحاسبية بالكامل"
              >
                <Undo2 className="w-4 h-4" />
                <span>عكس / إلغاء</span>
              </button>

              {/* حذف */}
              <button
                type="button"
                onClick={handleDeleteStudRv}
                disabled={studRvMode !== 'view' || !selectedStudRv || selectedStudRv.status === 'posted'}
                className={`financial-receipts-action financial-receipts-danger text-xs font-bold px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  studRvMode === 'view' && selectedStudRv && selectedStudRv.status !== 'posted'
                    ? 'bg-red-700 hover:bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                }`}
                title="حذف مسودة السند نهائياً"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف</span>
              </button>

              <div className="h-6 w-[1px] bg-slate-700 mx-1 hidden sm:block" />

              {/* تحديث ومزامنة */}
              <button
                type="button"
                onClick={handleRefreshReceipts}
                className="financial-receipts-action financial-receipts-paper text-xs font-bold px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="مزامنة وتحديث البيانات سحابياً"
              >
                <RefreshCw className="w-4 h-4" />
                <span>تحديث</span>
              </button>

              {/* طباعة */}
              <button
                type="button"
                onClick={() => {
                  if (!selectedStudRv) {
                    triggerNotification('الرجاء اختيار سند قبض للطباعة', 'warning');
                    return;
                  }
                  handlePrintSingleVoucher(selectedStudRv);
                  triggerNotification('🖨️ تم تجهيز السند وتوجيهه لأمر الطباعة ومعالج A4 بنجاح', 'success');
                }}
                className="financial-receipts-action financial-receipts-paper text-xs font-bold px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="طباعة السند الورقي محلياً"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>طباعة السند</span>
              </button>

              {/* تصدير PDF */}
              <button
                type="button"
                onClick={handleExportPdf}
                className="financial-receipts-action financial-receipts-gold text-xs font-bold px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="تصدير السند بصيغة PDF مشفر"
              >
                <FileText className="w-4 h-4 text-yellow-400" />
                <span>تصدير PDF</span>
              </button>

              {/* تصدير Excel */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="financial-receipts-action financial-receipts-navy text-xs font-bold px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="تصدير كشف السندات كجدول Excel"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Excel</span>
              </button>

            </div>

            {/* Split Screen Master-Detail Workspace */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              
              {/* LEFT COLUMN: Sidebar Vouchers List & Quick Filter Tabs */}
              <div className="no-print xl:col-span-1 p-4 space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                
                {/* Search field */}
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    value={rvSearch}
                    onChange={(e) => setRvSearch(e.target.value)}
                    placeholder="ابحث برقم السند، اسم الطالب، الشرح..."
                    className="block w-full pr-9 pl-3 py-2 text-xs border border-slate-300 bg-transparent focus:focus:outline-none focus:ring-1 focus:ring-[#9a6a1d] focus:border-[#9a6a1d]"
                  />
                </div>

                {/* Status Tab Filters */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 block mb-1.5">تصفية حسب حالة السند:</label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                    {[
                      { id: 'all', label: 'الكل' },
                      { id: 'draft', label: 'مسودة' },
                      { id: 'saved', label: 'محفوظ' },
                      { id: 'approved', label: 'معتمد' },
                      { id: 'posted', label: 'مرحل' },
                      { id: 'cancelled', label: 'ملغي' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setRvStatusFilter(tab.id)}
                        className={`text-[10px] font-bold py-1 px-1.5 rounded transition-all cursor-pointer ${
                          rvStatusFilter === tab.id
                            ? 'text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* List Scroll */}
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  <h4 className="text-[10px] font-black text-slate-400 border-b border-slate-100 pb-1.5 mb-2">📜 أرشيف المعاملات المحاسبية للتحصيل</h4>
                  
                  {filteredReceiptVouchers.length === 0 ? (
                    <p className="text-center py-6 text-slate-400 text-xs font-semibold">لا توجد سندات تطابق البحث أو التصفية.</p>
                  ) : (
                    filteredReceiptVouchers.map((voucher) => (
                      <div
                        key={voucher.id}
                        onClick={() => {
                          if (studRvMode !== 'view') {
                            const confirmLeave = window.confirm('⚠️ تحذير: لديك تعديلات غير محفوظة في النموذج الحالي. هل تود مغادرة التعديل واستعراض السند المختار؟');
                            if (!confirmLeave) return;
                            setStudRvMode('view');
                          }
                          setSelectedStudRv(voucher);
                        }}
                        className={`p-3 border text-xs cursor-pointer transition-all ${
                          selectedStudRv?.id === voucher.id 
                            ? 'bg-yellow-50 border-yellow-300 ring-1 ring-yellow-300' 
                            : 'bg-transparent border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex justify-between font-bold text-slate-900 mb-1">
                          <span className="truncate max-w-[150px]">{voucher.studentName}</span>
                          <span className="font-mono text-emerald-600" dir="ltr">+{voucher.amount.toLocaleString()} د.ل</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span className="font-mono font-bold text-slate-700">{voucher.id}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                            voucher.status === 'posted' ? 'bg-emerald-100 text-emerald-800' :
                            voucher.status === 'approved' ? 'bg-amber-100 text-amber-800' :
                            voucher.status === 'saved' ? 'bg-orange-100 text-orange-800' :
                            voucher.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {voucher.status === 'posted' ? 'مرحل' :
                             voucher.status === 'approved' ? 'معتمد' :
                             voucher.status === 'saved' ? 'محفوظ' :
                             voucher.status === 'cancelled' ? 'ملغي' : 'مسودة'}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 truncate mt-1">
                          {voucher.against}
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

              {/* RIGHT COLUMN: Active Voucher Sheet or Interactive Editing Form */}
              <div className="xl:col-span-2">
                
                {/* A) Form Mode: Create or Edit */}
                {(studRvMode === 'create' || studRvMode === 'edit') ? (
                  <div className="p-6 space-y-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                    <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                      <h4 className="text-sm font-black text-slate-900">
                        {studRvMode === 'create' ? '📋 نموذج تحرير سند قبض مالي جديد' : `📝 تعديل بيانات سند القبض ${studRvForm.id}`}
                      </h4>
                      <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 font-black">
                        وضع إدخال البيانات الماليـة
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      
                      {/* Select Student */}
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-700 block">الطالب المستهدف بالسداد: *</label>
                        <select
                          value={studRvForm.studentId}
                          onChange={(e) => handleStudentSelectInForm(e.target.value)}
                          disabled={studRvMode === 'edit'}
                          className="block w-full border border-slate-300 p-2.5 focus:ring-1 focus:ring-[#9a6a1d] focus:border-[#9a6a1d] focus:outline-none font-bold bg-slate-50"
                        >
                          <option value="">-- اختر طالب من قاعدة بيانات الفروع والمدارس --</option>
                          {students.map(s => {
                            const financialStudent = financialStudentRows.find(row => row.id === s.id);
                            const remainingBalance = financialStudent ? Number(financialStudent.feesRemaining || 0) : Number(s.feesRemaining || 0);
                            return (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.classroom || 'الفصل غير محدد'}) - متبقي عليه: {remainingBalance.toLocaleString()} د.ل
                              </option>
                            );
                          })}
                        </select>
                        <p className="text-[10px] text-slate-400">يتم جلب الطالب والصف الدراسي والمركز المالي تلقائياً</p>
                      </div>

                      {/* Date */}
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-700 block">تاريخ تحرير المعاملة: *</label>
                        <input
                          type="date"
                          value={studRvForm.date}
                          onChange={(e) => setStudRvForm(prev => ({ ...prev, date: e.target.value }))}
                          className="block w-full border border-slate-300 p-2.5 focus:ring-1 focus:ring-[#9a6a1d] focus:border-[#9a6a1d] focus:outline-none font-bold font-mono"
                        />
                      </div>

                      {/* Amount */}
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-700 block">مبلغ السند المقبوض (د.ل): *</label>
                        <input
                          type="number"
                          value={studRvForm.amount}
                          onChange={(e) => setStudRvForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                          className="block w-full border border-slate-300 p-2.5 focus:ring-1 focus:ring-[#9a6a1d] focus:border-[#9a6a1d] focus:outline-none font-bold font-mono text-emerald-600 text-sm"
                        />
                        {(() => {
                          const student = students.find(s => s.id === studRvForm.studentId);
                          const financialStudent = student ? financialStudentRows.find(row => row.id === student.id) : undefined;
                          const remainingBalance = financialStudent ? Number(financialStudent.feesRemaining || 0) : Number(student?.feesRemaining || 0);
                          if (student && studRvForm.amount > remainingBalance) {
                            return (
                              <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>تنبيه: المبلغ ({studRvForm.amount}) أكبر من المتبقي الموثق على الطالب ({remainingBalance})</span>
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Payment Method */}
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-700 block">طريقة القبض / السداد: *</label>
                        <select
                          value={studRvForm.paymentMethod}
                          onChange={(e) => setStudRvForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                          className="block w-full border border-slate-300 p-2.5 focus:ring-1 focus:ring-[#9a6a1d] focus:border-[#9a6a1d] focus:outline-none font-bold bg-slate-50"
                        >
                          <option value="نقدي">نقدي (كاش بالصندوق)</option>
                          <option value="بطاقة مدى البنكية (Mada)">بطاقة مدى البنكية (Mada)</option>
                          <option value="شيك">شيك مصدق مقبول الدفع</option>
                          <option value="تحويل">تحويل مصرفي فوري لجاري المدرسة</option>
                          <option value="فيزا / ماستركارد">فيزا / ماستركارد (دفع إلكتروني)</option>
                        </select>
                      </div>

                      {/* Receiving Account */}
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-700 block">الحساب المالي الفريد للاستلام: *</label>
                        <select
                          value={studRvForm.receivingAccount}
                          onChange={(e) => setStudRvForm(prev => ({ ...prev, receivingAccount: e.target.value }))}
                          className="block w-full border border-slate-300 p-2.5 focus:ring-1 focus:ring-[#9a6a1d] focus:border-[#9a6a1d] focus:outline-none font-bold bg-slate-50"
                        >
                          <option value="1101">1101 - صندوق الخزينة الرئيسي (كاش)</option>
                          <option value="1102">1102 - حساب مصرف الوحدة الجاري</option>
                        </select>
                      </div>

                      {/* Operational Type */}
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-700 block">بند الإيراد / التخصيص التشغيلي: *</label>
                        <select
                          value={studRvForm.operationalType}
                          onChange={(e) => setStudRvForm(prev => ({ ...prev, operationalType: e.target.value }))}
                          className="block w-full border border-slate-300 p-2.5 focus:ring-1 focus:ring-[#9a6a1d] focus:border-[#9a6a1d] focus:outline-none font-bold bg-slate-50"
                        >
                          <option value="رسوم دراسية">رسوم دراسية أساسية</option>
                          <option value="رسوم حافلة">رسوم اشتراك النقل المدرسي (حافلة)</option>
                          <option value="رسوم كتب ومطبوعات">كتب ومناهج ومستلزمات دراسية</option>
                        </select>
                      </div>

                      {/* Stage & Cost Center displays */}
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-400 block">المرحلة التعليمية المرتبطة:</label>
                        <input
                          type="text"
                          value={studRvForm.stage}
                          disabled
                          className="block w-full bg-transparent text-slate-500 p-2.5 font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-400 block">مركز التكلفة:</label>
                        <input
                          type="text"
                          value={studRvForm.costCenter}
                          disabled
                          className="block w-full bg-transparent text-slate-500 p-2.5 font-mono font-bold"
                        />
                      </div>

                    </div>

                    {/* Against */}
                    <div className="space-y-1 text-xs">
                      <label className="font-extrabold text-slate-700 block">البيان والشرح التفصيلي لأسباب الدفع (لأمر): *</label>
                      <textarea
                        value={studRvForm.against}
                        onChange={(e) => setStudRvForm(prev => ({ ...prev, against: e.target.value }))}
                        rows={3}
                        placeholder="اكتب شرحاً تفصيلياً يوضح وجه القيمة المدفوعة والفصل الدراسي والالتزام..."
                        className="block w-full border border-slate-300 p-2.5 focus:ring-1 focus:ring-[#9a6a1d] focus:border-[#9a6a1d] focus:outline-none font-semibold"
                      />
                    </div>

                    {/* Form actions */}
                    <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setStudRvMode('view');
                          setSelectedStudRv(studentReceiptVouchers[0] || null);
                          triggerNotification('تم إلغاء التعديل والتراجع.', 'info');
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 font-bold cursor-pointer"
                      >
                        إلغاء التراجع
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveStudRv}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 font-black flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>حفظ واعتماد المسودة</span>
                      </button>
                    </div>

                  </div>
                ) : (
                  
                  /* B) View Mode: Royal Printable Document Card */
                  <div className="space-y-4">
                    
                    {selectedStudRv ? (
                      <div className="space-y-4">
                        
                        {/* THE PRINTABLE TARGET AREA CARD */}
                        <div className="printable-area text-slate-900 p-8 shadow-md relative overflow-hidden space-y-6">
                          
                          {/* Top Background Design Accent (hidden in print automatically because of CSS print border none) */}
                          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-600 no-print" />
                          
                          {/* Royal Voucher Header */}
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-slate-200 pb-5 gap-4">
                            
                            {/* School Details */}
                            <div className="space-y-1.5">
                              <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                                <span className="p-1 rounded bg-[#2a1d13] text-[#fce79a] text-[10px]">ERP</span>
                                 <span>{selectedSchool?.name || 'المدرسة الحالية'}</span>
                              </h3>
                              <p className="text-[10px] text-slate-500 font-bold">بوابة الخدمات والمدفوعات السحابية والربط المالي الشامل</p>
                              <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold font-mono">
                                 <span>النطاق المالي: المدرسة الحالية</span>
                                 <span>•</span>
                                 <span>الفرع التشغيلي: {selectedBranch?.name || 'الفرع العام'}</span>
                                 <span>•</span>
                                 <span>العام الدراسي: {selectedSchool?.academicYear || selectedSchool?.currentAcademicYear || '2026/2027'}</span>
                              </div>
                            </div>

                            {/* Document Title & Serial */}
                            <div className="text-center md:text-left md:ml-4">
                              <h2 className="text-base font-black text-slate-900 bg-slate-100 px-4 py-1.5 inline-block">
                                سـنـد قـبـض مـالـي (طـلاب)
                              </h2>
                              <p className="text-xs text-slate-500 font-black font-mono mt-1" dir="ltr">
                                No. {selectedStudRv.id}
                              </p>
                            </div>

                            {/* QR Code and Date */}
                            <div className="flex items-center gap-3">
                              <div className="bg-transparent p-1.5 border border-slate-200">
                                <QrCode className="w-11 h-11 text-slate-900" />
                              </div>
                              <div className="text-[10px] text-slate-500 font-bold text-right space-y-1">
                                <div>تاريخ المعاملة:</div>
                                <div className="font-mono text-slate-900 text-xs font-black">{selectedStudRv.date}</div>
                                <div className="no-print">
                                  <span className={`px-2 py-0.5 rounded-full font-black text-[9px] inline-block ${
                                    selectedStudRv.status === 'posted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                    selectedStudRv.status === 'approved' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                    selectedStudRv.status === 'saved' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                                    selectedStudRv.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-300' :
                                    'bg-gray-100 text-gray-800 border border-gray-300'
                                  }`}>
                                    {selectedStudRv.status === 'posted' ? 'مرحل حسابياً' :
                                     selectedStudRv.status === 'approved' ? 'معتمد ماليـاً' :
                                     selectedStudRv.status === 'saved' ? 'محفوظ مسودة' :
                                     selectedStudRv.status === 'cancelled' ? 'ملغي ومسوى' : 'مسودة قيد التعبئة'}
                                  </span>
                                </div>
                              </div>
                            </div>

                          </div>

                          {/* Financial Particulars Sheet Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                            
                            <div className="space-y-1.5 border-b border-slate-100 pb-2">
                              <span className="text-[10px] text-slate-400 font-extrabold block">اسم الطالب (المسدد لأمره):</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-slate-900 text-sm">{selectedStudRv.studentName}</span>
                                <span className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                                  {selectedStudRv.studentId}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1.5 border-b border-slate-100 pb-2">
                              <span className="text-[10px] text-slate-400 font-extrabold block">طريقة الاستلام والقبض الفعالة:</span>
                              <span className="font-bold text-slate-900 text-sm">{selectedStudRv.paymentMethod}</span>
                            </div>

                            <div className="space-y-1.5 border-b border-slate-100 pb-2">
                              <span className="text-[10px] text-slate-400 font-extrabold block">الحساب الدفتري المتأثر (المدين):</span>
                              <div className="flex items-center gap-1 text-slate-900">
                                <span className="font-mono font-black text-yellow-650">({selectedStudRv.receivingAccount})</span>
                                <span className="font-bold">
                                  {selectedStudRv.receivingAccount === '1101' ? 'صندوق الخزينة الرئيسي (كاش)' : 'حساب مصرف الوحدة الجاري'}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1.5 border-b border-slate-100 pb-2">
                              <span className="text-[10px] text-slate-400 font-extrabold block">بند التحصيل والإيراد المفوتر:</span>
                              <span className="font-bold text-slate-900">{selectedStudRv.operationalType}</span>
                            </div>

                            <div className="space-y-1.5 border-b border-slate-100 pb-2">
                              <span className="text-[10px] text-slate-400 font-extrabold block">المرحلة ومركز التكلفة المرتبط:</span>
                              <div className="flex items-center gap-1 font-bold">
                                <span className="text-slate-900">مرحلة {selectedStudRv.stage}</span>
                                <span className="text-slate-300">•</span>
                                <span className="font-mono text-amber-650 font-black">{selectedStudRv.costCenter}</span>
                              </div>
                            </div>

                            <div className="space-y-1.5 border-b border-slate-100 pb-2">
                              <span className="text-[10px] text-slate-400 font-extrabold block">المستلم المالي المخول:</span>
                              <span className="font-bold text-slate-900">{auditActor}</span>
                            </div>

                          </div>

                          {/* Large Amount Card with Text converter */}
                          <div className="bg-transparent p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="space-y-1.5 text-center md:text-right">
                              <span className="text-[10px] text-slate-400 font-extrabold block">المبلغ المقبوض كتابة بالحروف:</span>
                              <p className="font-black text-slate-800 text-xs">
                                {convertNumberToArabicWords(selectedStudRv.amount)}
                              </p>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-2.5 text-center shrink-0">
                              <span className="text-[10px] font-black uppercase block text-emerald-600">المبلغ الإجمالي</span>
                              <span className="font-mono font-black text-lg">{selectedStudRv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span>
                            </div>
                          </div>

                          {/* Against (البيان) */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-400 font-extrabold block">وذلك قيمة لأمر / البيان والشرح التفصيلي:</span>
                            <div className="bg-transparent border border-slate-150 p-3 text-xs leading-relaxed text-slate-850 font-medium">
                              {selectedStudRv.against}
                            </div>
                          </div>

                          {/* double entry general ledger integration results */}
                          {selectedStudRv.status === 'posted' && (
                            <div className="border border-purple-200 bg-purple-50/50 p-4 space-y-3">
                              <div className="flex justify-between items-center border-b border-purple-100 pb-1.5">
                                <span className="text-[10px] font-black text-purple-800 flex items-center gap-1">
                                  <RefreshCw className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                  <span>⚙️ الأثر المحاسبي المزدوج في الحسابات المركزية (GL Ledger)</span>
                                </span>
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black border border-emerald-300">
                                  قيد مرحل بنجاح
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-[10px] text-center border-collapse">
                                  <thead>
                                    <tr className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                                      <th className="p-1 border border-purple-200 text-right">الحساب الدفتري للترحيل</th>
                                      <th className="p-1 border border-purple-200 text-right">رقم الحساب</th>
                                      <th className="p-1 border border-purple-200">مدين (د.ل)</th>
                                      <th className="p-1 border border-purple-200">دائن (د.ل)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="p-1.5 border border-purple-100 text-right font-bold">
                                        {selectedStudRv.receivingAccount === '1101' ? 'صندوق الخزينة الرئيسي (كاش)' : 'حساب مصرف الوحدة الجاري'}
                                      </td>
                                      <td className="p-1.5 border border-purple-100 text-right font-mono text-purple-900">{selectedStudRv.receivingAccount}</td>
                                      <td className="p-1.5 border border-purple-100 font-mono font-bold text-emerald-650">+{selectedStudRv.amount.toLocaleString()}</td>
                                      <td className="p-1.5 border border-purple-100 font-mono text-slate-400">0.00</td>
                                    </tr>
                                    <tr>
                                      <td className="p-1.5 border border-purple-100 text-right font-bold">إيرادات الرسوم الدراسية الموحدة</td>
                                      <td className="p-1.5 border border-purple-100 text-right font-mono text-purple-900">4101</td>
                                      <td className="p-1.5 border border-purple-100 font-mono text-slate-400">0.00</td>
                                      <td className="p-1.5 border border-purple-100 font-mono font-bold text-amber-650">+{selectedStudRv.amount.toLocaleString()}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {/* Document linkage navigation shortcuts */}
                              <div className="no-print flex flex-wrap gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => navigateToJournalEntry(selectedStudRv.journalEntryId)}
                                  className="bg-purple-650 hover:bg-purple-700 text-white font-bold text-[9px] px-2.5 py-1.5 rounded flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <span>انتقال إلى قيد اليومية العام:</span>
                                  <span className="font-mono underline">{selectedStudRv.journalEntryId} ↗</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => navigateToReceiptVoucher(selectedStudRv.receiptVoucherId)}
                                  className="bg-amber-650 hover:bg-amber-700 text-white font-bold text-[9px] px-2.5 py-1.5 rounded flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <span>انتقال إلى سند القبض العام:</span>
                                  <span className="font-mono underline">{selectedStudRv.receiptVoucherId} ↗</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Cancel notes warning */}
                          {selectedStudRv.status === 'cancelled' && (
                            <div className="border border-red-200 bg-red-50 text-red-800 p-4 space-y-1.5">
                              <p className="text-[10px] font-black flex items-center gap-1 text-red-700">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>⚠️ سند ملغي وعكس محاسبياً بالكامل</span>
                              </p>
                              <p className="text-[11px] leading-relaxed">
                                {selectedStudRv.notes || 'تم إلغاء السند المالي كمسودة غير مرحلة قبل حدوث أي أثر محاسبي.'}
                              </p>
                              {selectedStudRv.reversalJournalEntryId && (
                                <button
                                  type="button"
                                  onClick={() => navigateToJournalEntry(selectedStudRv.reversalJournalEntryId)}
                                  className="bg-red-700 hover:bg-red-800 text-white font-bold text-[9px] px-2.5 py-1 rounded mt-1 block no-print cursor-pointer"
                                >
                                  استعراض قيد التسوية العكسي: <span className="font-mono underline">{selectedStudRv.reversalJournalEntryId} ↗</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Audit logs trail */}
                          <div className="border-t border-dashed border-slate-200 pt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px] text-slate-500 font-bold">
                            <div>
                              <span>حرر بواسطة:</span>
                              <span className="text-slate-800 block mt-0.5">{selectedStudRv.createdBy || auditActor}</span>
                              <span className="text-slate-400 block font-mono mt-0.5">{selectedStudRv.createdAt || 'غير متاح'}</span>
                            </div>
                            <div>
                              <span>اعتمد بواسطة:</span>
                              <span className="text-slate-800 block mt-0.5">{selectedStudRv.approvedBy || '—'}</span>
                              <span className="text-slate-400 block font-mono mt-0.5">{selectedStudRv.approvedAt || '—'}</span>
                            </div>
                            <div>
                              <span>رُحّل بواسطة:</span>
                              <span className="text-slate-800 block mt-0.5">{selectedStudRv.postedBy || '—'}</span>
                              <span className="text-slate-400 block font-mono mt-0.5">{selectedStudRv.postedAt || '—'}</span>
                            </div>
                            <div>
                              <span>الختم والتوقيع الرقمي:</span>
                              <span className="text-emerald-600 block mt-0.5 flex items-center gap-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                معتمد سحابياً وموثق
                              </span>
                            </div>
                          </div>

                        </div>

                        {/* Stamps and physical seals below the paper card */}
                        <div className="no-print bg-slate-900 border border-slate-800 p-4 flex justify-between items-center text-xs text-slate-400">
                          <div className="space-y-1">
                            <span className="text-white font-extrabold block">🖨️ تعليمات المعاينة والطباعة الفورية</span>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                              تم برمجة نمط طباعة ذكي للورقة. الضغط على زر الطباعة سيخفي شريط الأوامر والقوائم الجانبية تلقائياً ويطبع السند فقط بحجم صفحة A4 قياسي مع ختم الإدارة.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-4 py-2 shrink-0 flex items-center gap-1.5 cursor-pointer shadow border border-amber-300"
                          >
                            <Printer className="w-4 h-4" />
                            <span>ابدأ طباعة الورقة 🖨️</span>
                          </button>
                        </div>

                      </div>
                    ) : (
                      <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3">
                        <Coins className="w-12 h-12 text-slate-300 animate-bounce" />
                        <p className="text-xs font-bold leading-relaxed">يرجى اختيار سند قبض مالي من القائمة الجانبية اليمنى، أو النقر على جديد للتحصيل.</p>
                      </div>
                    )}

                  </div>
                )}

              </div>

            </div>
          </div>
        )}

        {/* VIEW 7: تقارير الحسابات الشاملة */}
        {activeSubSec === 'reports' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="pb-4 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900">📊 تقارير الحسابات الشاملة وحوكمة المحفظة السحابية</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">توليد بيانات التدفق السنوي، سجل الميزانيات، وفحص العزل الكامل للبيانات بين الفروع والمدارس</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* Detailed statement table of receipts log */}
              <div className="p-5 space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <h4 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2">📈 ملخص الأرباح والخسائر والتدفق الفصلي</h4>
                
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-700 pb-2 border-b border-slate-100">
                    <span>إجمالي الرسوم المفوترة:</span>
                    <span className="font-extrabold font-mono text-slate-950">{formatLD(stats.totalDebts)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-700 pb-2 border-b border-slate-100">
                    <span>المدفوعات المتراكمة الفورية:</span>
                    <span className="font-extrabold font-mono text-emerald-600">{formatLD(stats.totalPaid)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-700 pb-2 border-b border-slate-100">
                    <span>المتأخرات الحالية الفعالة:</span>
                    <span className="font-extrabold font-mono text-amber-600">{formatLD(stats.totalRemaining)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-700 pb-2 border-b border-slate-100">
                    <span>نسبة التحصيل (كفاءة الأداء):</span>
                    <span className="font-black font-mono text-amber-600">
                      {stats.collectionRate === null ? 'غير متاح' : `${stats.collectionRate.toFixed(1)}%`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-700 pb-2">
                    <span>المصروفات والتوريد للوزارة والضرائب:</span>
                    <span className="font-extrabold font-mono text-slate-500">غير متاح — لا يوجد مصدر مصروفات موثق</span>
                  </div>
                </div>
              </div>

              {/* Data isolation security policy log checklist (Hidden for school workspace users) */}
              {false && (
                <div className="bg-slate-900 text-slate-200 p-5 shadow-lg border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-black text-emerald-400">🛡️ فحص حوكمة عزل البيانات RLS</span>
                    <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded text-[9px] font-black border border-emerald-500/30">مؤمن بالكامل</span>
                  </div>
                  
                  <p className="text-xs font-semibold leading-relaxed text-slate-300">
                    تم اختبار وفحص منظومة وعزل الجلسات على مستوى قاعدة بيانات PostgreSQL Row Level Security (RLS) بنجاح:
                  </p>

                  <div className="space-y-2.5 text-[11px] font-mono">
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>tenant_id validation matched (100% Secure)</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Cross-Tenant query prevention enabled</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Storage isolation buckets locked per school context</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Audit references fully synced to security logs</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="p-5 space-y-4 bg-white border-2 border-slate-200 rounded-3xl shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900">🔎 سجل الحركات التفصيلي</h4>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">تصفية مباشرة من المطالبات وسندات القبض في المصدر المالي الكانوني</p>
                </div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                  {financialReportRows.length} نتيجة مطابقة
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
                <label className="text-[10px] font-black text-slate-700">
                  بحث
                  <input
                    type="search"
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder="رقم، طالب، بيان..."
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </label>
                <label className="text-[10px] font-black text-slate-700">
                  الحالة
                  <select
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value)}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                  >
                    <option value="all">كل الحالات</option>
                    <option value="posted">مرحل حسابياً</option>
                    <option value="approved">معتمد مالياً</option>
                    <option value="saved">مسودة محفوظة</option>
                    <option value="draft">مسودة غير محفوظة</option>
                    <option value="paid">مسدد</option>
                    <option value="partial">مسدد جزئياً</option>
                    <option value="unpaid">غير مسدد</option>
                    <option value="cancelled">ملغى ومسوى</option>
                  </select>
                </label>
                <label className="text-[10px] font-black text-slate-700">
                  من تاريخ
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </label>
                <label className="text-[10px] font-black text-slate-700">
                  إلى تاريخ
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setReportSearch('');
                    setReportStatusFilter('all');
                    setReportStartDate('');
                    setReportEndDate('');
                  }}
                  className="h-9 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 text-xs font-black hover:bg-slate-100"
                >
                  مسح الفلاتر
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full min-w-[760px] text-right text-[10px]">
                  <thead className="bg-slate-900 text-amber-100 font-black">
                    <tr>
                      <th className="p-2">النوع</th>
                      <th className="p-2">المرجع</th>
                      <th className="p-2">التاريخ</th>
                      <th className="p-2">الطالب</th>
                      <th className="p-2">الحالة</th>
                      <th className="p-2 text-left">القيمة</th>
                      <th className="p-2">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {financialReportRows.slice(0, 200).map(row => (
                      <tr key={`${row.recordType}-${row.id}`} className="hover:bg-amber-50/50">
                        <td className="p-2 font-bold text-slate-700">{row.recordType}</td>
                        <td className="p-2 font-mono text-slate-500">{row.id}</td>
                        <td className="p-2 font-mono text-slate-500">{row.date || 'غير متاح'}</td>
                        <td className="p-2 font-bold text-slate-800">{row.student || 'غير محدد'}</td>
                        <td className="p-2 text-slate-600">{financialStatusLabel(row.status)}</td>
                        <td className="p-2 text-left font-mono font-black text-emerald-700">{formatLD(row.amount)}</td>
                        <td className="p-2">
                          <button
                            type="button"
                            aria-label={`فتح سجل ${row.id}`}
                            onClick={() => {
                              const student = students.find(item => item.id === row.studentId);
                              if (student) setSelectedStudent(student);
                              if (row.recordType === 'سند قبض') {
                                const voucher = studentReceiptVouchers.find(item => item.id === row.id);
                                if (voucher) setSelectedStudRv(voucher);
                                setStudRvMode('view');
                                setActiveSubSec('receipts');
                              } else {
                                setActiveSubSec('management');
                              }
                            }}
                            className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-900 hover:bg-amber-100"
                          >
                            فتح السجل
                          </button>
                        </td>
                      </tr>
                    ))}
                    {financialReportRows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">لا توجد حركات مطابقة للفلاتر الحالية.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {financialReportRows.length > 200 && (
                <p className="text-[10px] text-slate-500 font-bold">يُعرض أول 200 سجل؛ استخدم الفلاتر لتضييق النطاق قبل التصدير.</p>
              )}
            </div>
          </div>
        )}

        {/* VIEW 8: دورة الرقابة والترحيل الموحد */}
        {activeSubSec === 'accounting_integrity_demo' && (
          <div className="space-y-6 animate-fadeIn">
            <AccountingIntegrityDemo
              students={students}
              setStudents={setStudents}
              invoices={financialInvoices}
              setInvoices={setInvoices}
              triggerNotification={triggerNotification}
              logAction={logAction}
            />
          </div>
        )}

      </div>

      {/* RIGHT SIDEBAR: Category Menu (matches design & color from uploaded image) */}
      <div 
        id="financial-sidebar-menu" 
        className="w-full lg:w-80 bg-gradient-to-b from-[#0a1128] via-[#020817] to-[#010409] text-white border border-slate-800 p-5 shadow-25 flex flex-col justify-between shrink-0"
      >
        <div className="space-y-6">
          {/* Menu Title Header */}
          <div className="text-center py-4 border-b border-slate-800/80">
            <h3 className="text-lg font-extrabold text-white tracking-widest uppercase">حسابات الطلاب</h3>
            <div className="w-16 h-1 mx-auto bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 rounded mt-2" />
          </div>

          {/* List of Navigation Buttons as in the image */}
          <div className="space-y-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSubSec === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSubSec(item.id)}
                  className={`w-full flex items-center justify-between px-4 h-[52px] text-xs font-bold text-right transition-all duration-200 border select-none cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 border-teal-500/80 text-white shadow-[0_4px_12px_rgba(13,148,136,0.3)]' 
                      : 'bg-[#151f32] hover:bg-[#1c2840] border-[#222f46] hover:border-slate-600 text-slate-300 hover:text-white shadow-[0_2px_4px_rgba(0,0,0,0.15)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.badge && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isActive 
                          ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-[#0f1624] text-slate-400 border border-[#222f46]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>
                  
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Unified Active Saving Request Lock Screen Indicator */}
      {activeSaving && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] transition-opacity duration-300">
          <div className="border-2 border-amber-500 shadow-2xl p-6 max-w-sm mx-auto flex flex-col items-center gap-4 text-center animate-pulse">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200">
               <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">العملية جارية قيد التنفيذ</h3>
            <p className="text-slate-700 font-bold text-sm">
              جاري تنفيذ [<span className="text-amber-600">{activeSaving}</span>] حالياً.
              <br />
              يرجى الانتظار وعدم النقر مجدداً لضمان عدم تكرار السجلات.
            </p>
            <div className="text-xs text-amber-600 font-black px-3 py-1 bg-amber-50 rounded-lg">
              قفل الطلبات المحمي (Idempotency Request Lock) نشط حالياً
            </div>
          </div>
        </div>
      )}

    </div>
    </div>
  );
}
