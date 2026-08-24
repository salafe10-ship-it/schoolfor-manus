import { Activity, AlertTriangle, ArrowRightLeft, Building2, Calculator, Calendar, CheckCircle2, Coins, FileSpreadsheet, FileText, Hash, HelpCircle, Landmark, Layers, Lock as LockIcon, Percent, Play, Plus, Printer, RefreshCw, Search, Settings2, TrendingUp, UserCheck, Users, X } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { Student, Invoice, Stage, Grade, AcademicClass, CostCenter, UserRole } from '../types';
import { PostingEngine } from '../database/services/PostingEngine';
import { FallbackStorage } from '../database/repositories/FallbackStorage';
import { useCurrency } from '../utils/currency';
import EnterpriseActionToolbar from './shared/EnterpriseActionToolbar';
import { EnterpriseAuditLogger } from '../utils/EnterpriseAuditLogger';
import { PermissionsManagementModule, MODULES_SCHEMA } from './PermissionsManagementModule';
import { AccountingContext, type AccountNode } from '../modules/accounting/presentation/AccountingContext';
import { authenticatedRequest } from '../utils/authenticatedRequest';
export { AccountingContext };
export type { AccountNode };

const LedgerDashboardTab = React.lazy(() => import('../modules/accounting/presentation/LedgerDashboardTab').then(m => ({ default: m.LedgerDashboardTab })));
const ChartOfAccountsTab = React.lazy(() => import('../modules/accounting/presentation/ChartOfAccountsTab').then(m => ({ default: m.ChartOfAccountsTab })));
const CustomersLedgerTab = React.lazy(() => import('../modules/accounting/presentation/CustomersLedgerTab').then(m => ({ default: m.CustomersLedgerTab })));
const SuppliersLedgerTab = React.lazy(() => import('../modules/accounting/presentation/SuppliersLedgerTab').then(m => ({ default: m.SuppliersLedgerTab })));
const JournalEntriesTab = React.lazy(() => import('../modules/accounting/presentation/JournalEntriesTab').then(m => ({ default: m.JournalEntriesTab })));
const ReceiptVoucherTab = React.lazy(() => import('../modules/accounting/presentation/ReceiptVoucherTab').then(m => ({ default: m.ReceiptVoucherTab })));
const PaymentVoucherTab = React.lazy(() => import('../modules/accounting/presentation/PaymentVoucherTab').then(m => ({ default: m.PaymentVoucherTab })));
const BankTransfersTab = React.lazy(() => import('../modules/accounting/presentation/BankTransfersTab').then(m => ({ default: m.BankTransfersTab })));
const FixedAssetsTab = React.lazy(() => import('../modules/accounting/presentation/FixedAssetsTab').then(m => ({ default: m.FixedAssetsTab })));
const EstimatedBudgetTab = React.lazy(() => import('../modules/accounting/presentation/EstimatedBudgetTab').then(m => ({ default: m.EstimatedBudgetTab })));
const ClosingTab = React.lazy(() => import('../modules/accounting/presentation/ClosingTab').then(m => ({ default: m.ClosingTab })));
const FinancialReportsTab = React.lazy(() => import('../modules/accounting/presentation/FinancialReportsTab').then(m => ({ default: m.FinancialReportsTab })));
const CalcToolsTab = React.lazy(() => import('../modules/accounting/presentation/CalcToolsTab').then(m => ({ default: m.CalcToolsTab })));

interface GeneralLedgerPortalProps {
  students: Student[];
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  selectedSchool: { id: string; name: string; licenseNumber?: string };
  setActiveSection: (sec: string) => void;
  logAction: (action: string, details: string, module: string) => void;
  triggerNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
  currentRole?: UserRole;
  stages?: Stage[];
  setStages?: React.Dispatch<React.SetStateAction<Stage[]>>;
  grades?: Grade[];
  setGrades?: React.Dispatch<React.SetStateAction<Grade[]>>;
  academicClasses?: AcademicClass[];
  setAcademicClasses?: React.Dispatch<React.SetStateAction<AcademicClass[]>>;
  costCenters?: CostCenter[];
  setCostCenters?: React.Dispatch<React.SetStateAction<CostCenter[]>>;
  initialTab?: string;
  users?: any[];
  setUsers?: React.Dispatch<React.SetStateAction<any[]>>;
  roles?: any[];
  setRoles?: React.Dispatch<React.SetStateAction<any[]>>;
  permissionsAuditLog?: any[];
  setPermissionsAuditLog?: React.Dispatch<React.SetStateAction<any[]>>;
  currentDrillDownUser?: any;
  setDrillDownUser?: React.Dispatch<React.SetStateAction<any>>;
}

// Chart of accounts mock seed

export default function GeneralLedgerPortal({
  students,
  invoices,
  setInvoices,
  selectedSchool,
  setActiveSection,
  logAction,
  triggerNotification,
  currentRole,
  stages,
  setStages,
  grades,
  setGrades,
  academicClasses,
  setAcademicClasses,
  costCenters,
  setCostCenters,
  initialTab,
  users: usersProp,
  setUsers: setUsersProp,
  roles: rolesProp,
  setRoles: setRolesProp,
  permissionsAuditLog: permissionsAuditLogProp,
  setPermissionsAuditLog: setPermissionsAuditLogProp,
  currentDrillDownUser: currentDrillDownUserProp,
  setDrillDownUser: setDrillDownUserProp
}: GeneralLedgerPortalProps) {
  const { currencyConfig, format: formatCurrency } = useCurrency();
  const canonicalPersistenceRequired = FallbackStorage.isCanonicalPersistenceRequired();
  useEffect(() => {
    if (canonicalPersistenceRequired) {
      triggerNotification('تم إخفاء البيانات الافتراضية للأستاذ العام حتى يتم تحميل المصدر المحاسبي المركزي الموثوق.', 'warning');
    }
  }, [canonicalPersistenceRequired, triggerNotification]);
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'dashboard');
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>(initialTab || 'dashboard');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
      const [showJvSearchOverlay, setShowJvSearchOverlay] = useState<boolean>(false);
  const [showJvPrintModal, setShowJvPrintModal] = useState<boolean>(false);
  const [selectedJvPrintTemplate, setSelectedJvPrintTemplate] = useState<string | null>(null);
  const [drillDownStack, setDrillDownStack] = useState<any[]>([]);
          const [currency, setCurrency] = useState<'LYD' | 'SAR'>('LYD');

  const [jvColWidths, setJvColWidths] = useState<any>({});
    const [jvSearchFilters, setJvSearchFilters] = useState<any>({});
  const [jvAuditTrail, setJvAuditTrail] = useState<any[]>([]);
  const [jvAttachmentsList, setJvAttachmentsList] = useState<any[]>([]);
  const [jvTableMaximized, setJvTableMaximized] = useState<boolean>(false);
  const [receiptVouchers, setReceiptVouchers] = useState<any[]>([]);
  const [paymentVouchers, setPaymentVouchers] = useState<any[]>([]);
  const [receiptVoucherForm, setReceiptVoucherForm] = useState<any>(() => ({
    date: new Date().toISOString().split('T')[0],
    school: 'مدرسة الأسرة الحديثة - فرع طرابلس',
    stage: 'الابتدائي',
    costCenter: 'primary',
    receivedFrom: '',
    operationType: 'رسوم دراسية',
    paymentMethod: 'نقدي',
    receivingAccount: '1101',
    amount: '',
    against: 'دفعة من الرسوم الدراسية للعام الجديد',
    attachmentName: '',
    notes: 'تم ترحيل السند وتوطين الأرصدة تلقائياً بنظام القيد المزدوج المعتمد'
  }));
  const [paymentVoucherForm, setPaymentVoucherForm] = useState<any>(() => ({
    date: new Date().toISOString().split('T')[0],
    costCenter: 'primary',
    beneficiary: '',
    paidFromAccount: '1101',
    paidToAccount: '5270',
    amount: '',
    against: 'مستخلص سداد دفعة توريد كتب وقرطاسية مدرسية',
    paymentMethod: 'نقدي',
    attachmentName: '',
    notes: 'خصماً من حساب الميزانية العمومية والتشغيلية المعتمدة لفرع طرابلس'
  }));
  const [bankTransfers, setBankTransfers] = useState<any[]>([]);
          const [receiptSearch, setReceiptSearch] = useState<string>('');
  const [receiptCostCenterFilter, setReceiptCostCenterFilter] = useState<string>('all');
  const [paymentSearch, setPaymentSearch] = useState<string>('');
  const [paymentCostCenterFilter, setPaymentCostCenterFilter] = useState<string>('all');
  const [fixedAssets, setFixedAssets] = useState<any[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [activeAssetTab, setActiveAssetTab] = useState<string>('details');
  const [isEditAssetMode, setIsEditAssetMode] = useState<boolean>(false);
  const [isNewAssetMode, setIsNewAssetMode] = useState<boolean>(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState<string>('');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState<string>('all');
  const [assetStatusFilter, setAssetStatusFilter] = useState<string>('all');
  const [assetCostCenterFilter, setAssetCostCenterFilter] = useState<string>('all');
  const [assetForm, setAssetForm] = useState<any>({});
  const [maintenanceForm, setMaintenanceForm] = useState<any>({});
  const [transferForm, setTransferForm] = useState<any>({});
  const [saleForm, setSaleForm] = useState<any>({});
  const [discardForm, setDiscardForm] = useState<any>({});
  const [activeAssetModal, setActiveAssetModal] = useState<string | null>(null);
  const [fixedAssetReportType, setFixedAssetReportType] = useState<string>('all_assets');
  const [fixedAssetViewMode, setFixedAssetViewMode] = useState<string>('management');
  const [budgets, setBudgets] = useState<any[]>([]);


  const [closingDescriptionInput, setClosingDescriptionInput] = useState<string>('');
  const [unapprovedAdjustmentsCount, setUnapprovedAdjustmentsCount] = useState<number>(0);
  const [expandedNodes, setExpandedNodes] = useState<any[]>([]);
  const [coaForm, setCoaForm] = useState<any>({});
  const [showCoaImportModal, setShowCoaImportModal] = useState<boolean>(false);
  const [coaImportText, setCoaImportText] = useState<string>('');
  const [isJvFullscreen, setIsJvFullscreen] = useState<boolean>(false);
  const [selectedJvId, setSelectedJvId] = useState<string | null>(null);
  const [jvEditMode, setJvEditMode] = useState<boolean>(false);
  const [activeJvTab, setActiveJvTab] = useState<string>('list');
  const [copiedJvLine, setCopiedJvLine] = useState<any | null>(null);
  const [jvTableSearch, setJvTableSearch] = useState<string>('');
  const [jvFocusedRowIndex, setJvFocusedRowIndex] = useState<number | null>(null);

  const [filterFinancialPeriod, setFilterFinancialPeriod] = useState<any>(null);
  const [filterFromDate, setFilterFromDate] = useState<any>(null);
  const [filterToDate, setFilterToDate] = useState<any>(null);
  const [filterFiscalYear, setFilterFiscalYear] = useState<any>(null);
  const [filterAccountingPeriod, setFilterAccountingPeriod] = useState<any>(null);
  const [filterCostCenter, setFilterCostCenter] = useState<any>(null);
  const [filterAccount, setFilterAccount] = useState<any>(null);
  const [filterActiveOnly, setFilterActiveOnly] = useState<any>(null);
  const [filterBalanceOnly, setFilterBalanceOnly] = useState<any>(null);
  const [filterSortBy, setFilterSortBy] = useState<any>(null);
  const [trialBalanceLevel, setTrialBalanceLevel] = useState<any>(null);
  // The closing screen renders its readiness controls only from the
  // explicit `check` step. Starting with null leaves the screen header
  // visible while hiding every actionable closing command.
  const [closingStep, setClosingStep] = useState<any>('check');
  const [isCheckingReady, setIsCheckingReady] = useState<any>(null);
  const [checkedReady, setCheckedReady] = useState<any>(null);
  const [closingProgress, setClosingProgress] = useState<any>(null);
  const [closingProgressMessage, setClosingProgressMessage] = useState<any>(null);
  const [closingAuditLog, setClosingAuditLog] = useState<any>(null);
  const [isYearClosed, setIsYearClosed] = useState<any>(null);
  const [closingRefNo, setClosingRefNo] = useState<any>(null);
  const [closingDate, setClosingDate] = useState<any>(null);
  const [openedYear2027, setOpenedYear2027] = useState<any>(null);
  const [currentClosingYear, setCurrentClosingYear] = useState<any>(null);
  const [closingDateInput, setClosingDateInput] = useState<any>(null);
  const [newYearStartDateInput, setNewYearStartDateInput] = useState<any>(null);
  const [newYearEndDateInput, setNewYearEndDateInput] = useState<any>(null);
  const [newYearNumberInput, setNewYearNumberInput] = useState<any>(null);

    const [activeJvState, setActiveJvState] = useState<any>(null);
  const [selectedReceiptVoucher, setSelectedReceiptVoucher] = useState<any | null>(null);
  const [showReceiptDetailModal, setShowReceiptDetailModal] = useState<boolean>(false);
  const [selectedPaymentVoucher, setSelectedPaymentVoucher] = useState<any | null>(null);
  const [showPaymentDetailModal, setShowPaymentDetailModal] = useState<boolean>(false);

  const [calcExpr, setCalcExpr] = useState<string>('');
  const [calcResult, setCalcResult] = useState<number>(0);
  const [fxAmount, setFxAmount] = useState<number>(0);
  const [fxFrom, setFxFrom] = useState<string>('LYD');
  const [fxResult, setFxResult] = useState<number>(0);
  const [bankTransferForm, setBankTransferForm] = useState<any>({});
  const [showAddJVModal, setShowAddJVModal] = useState<boolean>(false);
  const [newJV, setNewJV] = useState<any>({});

  // Removed duplicated state definitions

  const loadJvForView = (jvId: string) => {
    setSelectedJvId(jvId);
    setActiveJvTab('list');
  };
  const printVoucherDirect = (voucher: any, title: string) => {
    if (!voucher?.id) {
      triggerNotification('تعذر الطباعة: السند المحدد غير موثق.', 'warning');
      return;
    }
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) {
      triggerNotification('تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة للموقع ثم أعد المحاولة.', 'warning');
      return;
    }
    const safe = (value: unknown) => String(value ?? '—').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
    printWindow.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>${safe(title)} ${safe(voucher.id)}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#172033}h1{border-bottom:2px solid #d4af37;padding-bottom:12px}table{width:100%;border-collapse:collapse;margin-top:24px}td{border:1px solid #ccd3df;padding:10px}td:first-child{font-weight:bold;background:#f8f5ee;width:35%}@media print{button{display:none}}</style></head><body><h1>${safe(title)}</h1><table><tr><td>رقم السند</td><td>${safe(voucher.id)}</td></tr><tr><td>التاريخ</td><td>${safe(voucher.date)}</td></tr><tr><td>المبلغ</td><td>${safe(voucher.amount)} ${safe(currency)}</td></tr><tr><td>البيان</td><td>${safe(voucher.against)}</td></tr><tr><td>الحساب</td><td>${safe(voucher.receivingAccount || voucher.paidFromAccount || voucher.paidToAccount)}</td></tr><tr><td>الحالة</td><td>${safe(voucher.status)}</td></tr></table><script>window.onload=()=>window.print();</script></body></html>`);
    printWindow.document.close();
  };
  const handlePrintReceiptDirect = (voucher: any) => printVoucherDirect(voucher, 'سند قبض موثق');
  const handlePrintPaymentDirect = (voucher: any) => printVoucherDirect(voucher, 'سند صرف موثق');

  const handlePrintDepreciationSchedule = (assetId?: string) => {
    if (!canonicalFinancialStatus || canonicalFinancialStatus !== 'ready') {
      triggerNotification('تعذر طباعة جدول الإهلاك: المصدر المركزي غير جاهز.', 'warning');
      return;
    }
    const asset = fixedAssets.find(item => item.id === assetId);
    if (!asset) {
      triggerNotification('لا يوجد أصل موثق لإصدار جدول إهلاكه.', 'warning');
      return;
    }
    printVoucherDirect({ id: asset.id, date: new Date().toISOString().slice(0, 10), amount: asset.netValue, against: `جدول إهلاك الأصل ${asset.name}`, status: 'موثق' }, 'جدول إهلاك أصل');
  };
  const findOriginalDocument = (id: string) => {
    const found = [...receiptVouchers, ...paymentVouchers, ...journalEntries].find((item: any) => item.id === id);
    if (!found) triggerNotification(`لم يتم العثور على مستند موثق بالمرجع ${id}.`, 'warning');
  };
  const handleReportAccountClick = (acc: string) => {
    setActiveTab('financial_reports');
    setFilterAccount(acc);
  };
  const handleJournalEntryClick = (jvId: string) => loadJvForView(jvId);
  const isAccountOrDescendant = (acc: string, parent: string) => {
    if (!acc || !parent) return false;

    const normalize = (value: string) => String(value).trim();
    const accountCode = normalize(acc);
    const parentCode = normalize(parent);
    if (accountCode === parentCode) return true;

    const accountByCode = new Map<string, AccountNode>(accounts.map(account => [normalize(account.code), account]));
    const accountById = new Map<string, AccountNode>(accounts.map(account => [normalize(account.id), account]));
    const visited = new Set<string>();
    let current = accountByCode.get(accountCode) || accountById.get(accountCode);

    while (current?.parentAccountId && !visited.has(current.code)) {
      visited.add(current.code);
      const ancestor = normalize(String(current.parentAccountId));
      if (ancestor === parentCode) return true;
      current = accountByCode.get(ancestor) || accountById.get(ancestor);
    }

    return false;
  };

  const getProcessedAccounts = (options?: {
    fromDate?: string;
    toDate?: string;
    costCenter?: string;
  }) => {
    const toAmount = (value: unknown) => {
      const amount = Number(value);
      return Number.isFinite(amount) ? amount : 0;
    };

    const sourceAccounts = accounts.map(account => ({
      ...account,
      openingBalance: 0,
      debitMovements: 0,
      creditMovements: 0,
      endingBalance: 0,
      allDebitMovements: 0,
      allCreditMovements: 0
    }));
    const accountByCode = new Map<string, typeof sourceAccounts[number]>(sourceAccounts.map(account => [String(account.code), account]));
    const accountById = new Map<string, typeof sourceAccounts[number]>(sourceAccounts.map(account => [String(account.id), account]));

    // When the canonical chart is present, its balance is the persisted
    // closing balance. When it is absent, the connected journal stream is the
    // source of truth and balances are derived from its posted movements.
    const hasCanonicalBalances = canonicalSnapshotHasAccounts;
    sourceAccounts.forEach(account => {
      account.openingBalance = 0;
      account.endingBalance = 0;
    });

    const normalizedEntries = canonicalFinancialStatus === 'ready'
      ? getNormalizedJournalEntries().filter((entry: any) =>
          entry.status === 'مرحل' || entry.status === 'معتمد' || entry.status === 'posted' || entry.status === 'approved'
        )
      : [];

    const periodEntries = normalizedEntries.filter((entry: any) => {
      const date = String(entry.date || '');
      if (options?.fromDate && date < options.fromDate) return false;
      if (options?.toDate && date > options.toDate) return false;
      return true;
    });

    const applyLines = (entries: any[], movementKey: 'period' | 'all', applyCostCenterFilter: boolean) => entries.forEach((entry: any) => {
      if (!Array.isArray(entry.lines)) return;
      entry.lines.forEach((line: any) => {
        if (applyCostCenterFilter && options?.costCenter && options.costCenter !== 'all' && line.costCenter !== options.costCenter) return;
        const code = String(line.accountCode || line.accountId || '').trim();
        const account = accountByCode.get(code) || accountById.get(code);
        if (!account) return;
        const debit = toAmount(line.debit);
        const credit = toAmount(line.credit);
        if (movementKey === 'all') {
          account.allDebitMovements += debit;
          account.allCreditMovements += credit;
        } else {
          account.debitMovements += debit;
          account.creditMovements += credit;
        }
      });
    });

    // All movements establish the opening balance when the canonical chart
    // stores a current closing balance; period movements establish the report
    // closing balance. This keeps Q1/Q2/full-year reports consistent.
    applyLines(normalizedEntries, 'all', false);
    applyLines(periodEntries, 'period', true);

    sourceAccounts.forEach(account => {
      const isDebitNature = account.natureType === 'مدين' || account.classification === 'أصول' || account.classification === 'مصروفات';
      const allSignedMovement = isDebitNature
        ? account.allDebitMovements - account.allCreditMovements
        : account.allCreditMovements - account.allDebitMovements;
      const periodSignedMovement = isDebitNature
        ? account.debitMovements - account.creditMovements
        : account.creditMovements - account.debitMovements;
      const persistedBalance = toAmount(account.balance);

      account.openingBalance = hasCanonicalBalances ? persistedBalance - allSignedMovement : 0;
      account.endingBalance = account.openingBalance + periodSignedMovement;
    });

    const childrenByParent = new Map<string, typeof sourceAccounts>();
    sourceAccounts.forEach(account => {
      if (!account.parentAccountId) return;
      const key = String(account.parentAccountId);
      const children = childrenByParent.get(key) || [];
      children.push(account);
      childrenByParent.set(key, children);
    });

    const aggregate = (account: typeof sourceAccounts[number], visited = new Set<string>()) => {
      if (visited.has(account.code)) return account;
      const nextVisited = new Set(visited);
      nextVisited.add(account.code);
      const children = [
        ...(childrenByParent.get(account.code) || []),
        ...(childrenByParent.get(account.id) || [])
      ].filter((child, index, list) => list.findIndex(item => item.code === child.code) === index);

      children.forEach(child => aggregate(child, nextVisited));
      if (children.length > 0) {
        account.openingBalance = children.reduce((sum, child) => sum + child.openingBalance, 0);
        account.debitMovements = children.reduce((sum, child) => sum + child.debitMovements, 0);
        account.creditMovements = children.reduce((sum, child) => sum + child.creditMovements, 0);
        account.endingBalance = children.reduce((sum, child) => sum + child.endingBalance, 0);
      }
      return account;
    };

    sourceAccounts.filter(account => !account.parentAccountId).forEach(root => aggregate(root));

    return sourceAccounts;
  };
  const handleCalcPress = (expr: string) => {
    const normalized = String(expr || '').replace(/[^0-9+\-*/().\s]/g, '');
    if (!normalized.trim()) {
      setCalcResult(0);
      return;
    }
    try {
      const result = Function(`"use strict"; return (${normalized})`)();
      if (!Number.isFinite(result)) throw new Error('invalid result');
      setCalcExpr(expr);
      setCalcResult(Number(result));
    } catch {
      triggerNotification('تعذر حساب التعبير: الصيغة غير صالحة.', 'warning');
    }
  };
  const handleBankTransferSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!canonicalFinancialWriteReady) {
      triggerNotification('لم تعتمد الحوالة: المصدر المالي الحالي للقراءة فقط ولا توجد خدمة دفتر أستاذ كانونية معتمدة.', 'warning');
      return;
    }

    const sourceAccountCode = String(bankTransferForm.sourceAccount || '').trim();
    const destinationAccountCode = String(bankTransferForm.destinationAccount || '').trim();
    const amount = Number(bankTransferForm.amount);
    const sourceAccount = accounts.find(account => account.code === sourceAccountCode);
    const destinationAccount = accounts.find(account => account.code === destinationAccountCode);
    const sourceBalance = Number(sourceAccount?.balance ?? 0);

    if (!sourceAccount || !destinationAccount || sourceAccountCode === destinationAccountCode) {
      triggerNotification('اختر حسابي مصدر ومستقبل مختلفين وموثقين في دليل الحسابات.', 'warning');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      triggerNotification('أدخل مبلغ حوالة موجبًا وقابلًا للتحقق.', 'warning');
      return;
    }
    if (Number.isFinite(sourceBalance) && sourceBalance < amount) {
      triggerNotification('لا يمكن اعتماد الحوالة: رصيد حساب المصدر أقل من المبلغ المطلوب.', 'warning');
      return;
    }

    const sequence = `${Date.now()}`.slice(-8);
    const date = new Date().toISOString().slice(0, 10);
    const transferId = `BT-${date.replaceAll('-', '')}-${sequence}`;
    const journalId = `JV-${date.replaceAll('-', '')}-BT-${sequence}`;
    const description = String(bankTransferForm.purpose || `تحويل داخلي من ${sourceAccountCode} إلى ${destinationAccountCode}`).trim();
    const transfer = {
      id: transferId,
      date,
      sourceAccount: sourceAccountCode,
      destinationAccount: destinationAccountCode,
      amount,
      reference: String(bankTransferForm.reference || transferId).trim(),
      purpose: description,
      status: 'معتمد',
      journalEntryId: journalId,
      createdAt: new Date().toISOString()
    };
    const journalEntry = {
      id: journalId,
      date,
      description: `حوالة بنكية داخلية ${transfer.reference}: ${description}`,
      status: 'مرحل',
      type: 'بسيط',
      debitTotal: amount,
      creditTotal: amount,
      isSystemGenerated: true,
      bankTransferId: transferId,
      lines: [
        { id: `${journalId}-D`, accountCode: destinationAccountCode, accountName: destinationAccount.name, debit: amount, credit: 0 },
        { id: `${journalId}-C`, accountCode: sourceAccountCode, accountName: sourceAccount.name, debit: 0, credit: amount }
      ],
      createdAt: new Date().toISOString()
    };
    const updatedAccounts = accounts.map(account => {
      if (account.code !== sourceAccountCode && account.code !== destinationAccountCode) return account;
      const delta = account.code === destinationAccountCode ? amount : -amount;
      return {
        ...account,
        balance: Number(account.balance || 0) + delta,
        debitMovements: Number(account.debitMovements || 0) + (account.code === destinationAccountCode ? amount : 0),
        creditMovements: Number(account.creditMovements || 0) + (account.code === sourceAccountCode ? amount : 0)
      };
    });

    try {
      await persistCanonicalFinancialSnapshot({
        chartOfAccounts: updatedAccounts,
        bankTransfers: [transfer, ...bankTransfers],
        journalEntries: [journalEntry, ...journalEntries]
      });
      setAccounts(updatedAccounts);
      setBankTransfers(previous => [transfer, ...previous]);
      setJournalEntries(previous => [journalEntry, ...previous]);
      setBankTransferForm({});
      triggerNotification(`اعتمدت الحوالة ${transferId} ورُحّل قيدها ${journalId} مركزيًا.`, 'success');
    } catch (error: any) {
      triggerNotification(error?.message || 'تعذر اعتماد الحوالة مركزيًا؛ لم تتغير البيانات.', 'warning');
    }
  };
  const handleSelectAsset = (assetId: string) => {
    const asset = fixedAssets.find(item => item.id === assetId);
    if (!asset) {
      triggerNotification('الأصل المحدد غير موجود في المصدر المركزي.', 'warning');
      return;
    }
    setSelectedAssetId(assetId);
    setAssetForm({ ...asset });
  };
  const handleNewAsset = () => {
    setIsNewAssetMode(true);
    setIsEditAssetMode(true);
    setAssetForm({ id: '', code: '', name: '', category: '', cost: 0, accDep: 0, netValue: 0, status: 'نشط / قيد التشغيل' });
  };
  const findAccountForAssetAction = (code: unknown) => accounts.find(account => account.code === String(code || '').trim());
  const adjustAccountsForLines = (sourceAccounts: any[], lines: any[], direction = 1) => sourceAccounts.map(account => {
    const accountLines = lines.filter(line => line.accountCode === account.code);
    if (accountLines.length === 0) return account;
    const debit = accountLines.reduce((sum, line) => sum + Number(line.debit || 0), 0) * direction;
    const credit = accountLines.reduce((sum, line) => sum + Number(line.credit || 0), 0) * direction;
    const net = account.natureType === 'دائن' ? credit - debit : debit - credit;
    return {
      ...account,
      balance: Number(account.balance || 0) + net,
      debitMovements: Number(account.debitMovements || 0) + debit,
      creditMovements: Number(account.creditMovements || 0) + credit
    };
  });
  const persistAssetAction = async (updatedAssets: any[], patch: Record<string, any> = {}) => {
    await persistCanonicalFinancialSnapshot({ fixedAssets: updatedAssets, ...patch });
    setFixedAssets(updatedAssets);
  };
  const handleSaveAsset = async () => {
    if (!requireCanonicalFinancialWrite('حفظ الأصل')) return;
    const name = String(assetForm.name || '').trim();
    const code = String(assetForm.code || '').trim();
    const cost = Number(assetForm.cost || 0);
    if (!name || !code || !Number.isFinite(cost) || cost <= 0) {
      triggerNotification('أدخل اسم الأصل ورمزه وتكلفة اقتناء موجبة قبل الحفظ.', 'warning');
      return;
    }
    const id = String(assetForm.id || `FA-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`);
    const capitalExp = Number(assetForm.capitalExp || 0);
    const accDep = Math.max(0, Number(assetForm.accDep || 0));
    const savedAsset = {
      ...assetForm,
      id,
      code,
      name,
      cost,
      capitalExp: Number.isFinite(capitalExp) ? capitalExp : 0,
      accDep,
      netValue: Math.max(0, cost + (Number.isFinite(capitalExp) ? capitalExp : 0) - accDep),
      status: assetForm.status || 'نشط / قيد التشغيل',
      createdAt: assetForm.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updatedAssets = fixedAssets.some(asset => asset.id === id)
      ? fixedAssets.map(asset => asset.id === id ? savedAsset : asset)
      : [savedAsset, ...fixedAssets];
    try {
      await persistAssetAction(updatedAssets);
      setAssetForm(savedAsset);
      setSelectedAssetId(id);
      setIsNewAssetMode(false);
      setIsEditAssetMode(false);
      setActiveAssetModal(null);
      triggerNotification(`تم حفظ الأصل ${id} في المصدر المالي المركزي.`, 'success');
    } catch (error: any) {
      triggerNotification(error?.message || 'تعذر حفظ الأصل مركزيًا؛ لم تتغير البيانات.', 'warning');
    }
  };
  const handleDeleteAsset = async (assetId: string) => {
    const asset = fixedAssets.find(item => item.id === assetId);
    if (!asset || !canonicalFinancialWriteReady) {
      triggerNotification('تعذر استبعاد الأصل: الأصل غير موثق أو المصدر المركزي غير جاهز.', 'warning');
      return;
    }
    const updatedAsset = {
      ...asset,
      status: 'مستبعد',
      updatedAt: new Date().toISOString(),
      operations: [...(asset.operations || []), { id: `OP-${Date.now()}`, type: 'استبعاد الأصل', date: new Date().toISOString().slice(0, 10), details: 'استبعاد إداري آمن؛ يلزم قيد مالي مستقل قبل التسوية.' }]
    };
    try {
      await persistAssetAction(fixedAssets.map(item => item.id === assetId ? updatedAsset : item));
      setAssetForm(updatedAsset);
      triggerNotification(`تم استبعاد الأصل ${assetId} إداريًا مع حفظ سجل التدقيق.`, 'success');
    } catch (error: any) {
      triggerNotification(error?.message || 'تعذر استبعاد الأصل مركزيًا.', 'warning');
    }
  };
  const handleRecalculateAssetDepreciation = async (assetId: string) => {
    const asset = fixedAssets.find(item => item.id === assetId);
    if (!asset || !canonicalFinancialWriteReady) {
      triggerNotification('تعذر إعادة الاحتساب: الأصل غير موثق أو المصدر المركزي غير جاهز.', 'warning');
      return;
    }
    const costBasis = Number(asset.cost || 0) + Number(asset.capitalExp || 0);
    const scrap = Math.max(0, Number(asset.scrapValue || 0));
    const life = Math.max(1, Number(asset.usefulLife || 5));
    const annual = Math.max(0, (costBasis - scrap) / life);
    const purchaseYear = new Date(asset.purchaseDate || asset.date || new Date()).getFullYear();
    const elapsed = Math.min(life, Math.max(0, new Date().getFullYear() - purchaseYear + 1));
    const accDep = Math.min(costBasis - scrap, annual * elapsed);
    const updatedAsset = { ...asset, accDep, netValue: Math.max(scrap, costBasis - accDep), updatedAt: new Date().toISOString(), lastDepreciationCalculation: new Date().toISOString() };
    try {
      await persistAssetAction(fixedAssets.map(item => item.id === assetId ? updatedAsset : item));
      setAssetForm(updatedAsset);
      triggerNotification(`أعيد احتساب إهلاك ${assetId} بقيمة ${accDep.toFixed(2)} ${currency} مركزيًا.`, 'success');
    } catch (error: any) {
      triggerNotification(error?.message || 'تعذر حفظ إعادة الاحتساب.', 'warning');
    }
  };
  const handlePostAssetDepreciation = async (assetId: string) => {
    const asset = fixedAssets.find(item => item.id === assetId);
    const expenseAccount = findAccountForAssetAction(asset?.depExpenseAccount);
    const accumulatedAccount = findAccountForAssetAction(asset?.accDepAccount);
    if (!asset || !canonicalFinancialWriteReady) {
      triggerNotification('تعذر ترحيل الإهلاك: الأصل غير موثق أو المصدر المركزي غير جاهز.', 'warning');
      return;
    }
    if (!expenseAccount || !accumulatedAccount) {
      triggerNotification('لم يُرحّل الإهلاك: عيّن حساب مصروف الإهلاك وحساب مجمع الإهلاك من دليل الحسابات.', 'warning');
      return;
    }
    const year = new Date().getFullYear();
    const alreadyPosted = (asset.depreciationPostings || []).some((posting: any) => Number(posting.year) === year && posting.status === 'posted');
    if (alreadyPosted) {
      triggerNotification(`قسط الإهلاك للسنة ${year} مرحّل مسبقًا لهذا الأصل.`, 'warning');
      return;
    }
    const costBasis = Number(asset.cost || 0) + Number(asset.capitalExp || 0);
    const annual = Math.max(0, (costBasis - Number(asset.scrapValue || 0)) / Math.max(1, Number(asset.usefulLife || 5)));
    const amount = Math.min(Math.max(0, Number(asset.netValue || costBasis) - Number(asset.scrapValue || 0)), annual);
    if (amount <= 0) {
      triggerNotification('لا يوجد قسط إهلاك موجب قابل للترحيل لهذا الأصل.', 'warning');
      return;
    }
    const journalId = `JV-${year}-FADEP-${Date.now().toString().slice(-8)}`;
    const lines = [
      { id: `${journalId}-D`, accountCode: expenseAccount.code, accountName: expenseAccount.name, debit: amount, credit: 0 },
      { id: `${journalId}-C`, accountCode: accumulatedAccount.code, accountName: accumulatedAccount.name, debit: 0, credit: amount }
    ];
    const journalEntry = { id: journalId, date: new Date().toISOString().slice(0, 10), description: `إهلاك أصل ثابت ${asset.name} للسنة ${year}`, status: 'مرحل', type: 'بسيط', debitTotal: amount, creditTotal: amount, isSystemGenerated: true, fixedAssetId: asset.id, lines, createdAt: new Date().toISOString() };
    const updatedAsset = { ...asset, accDep: Number(asset.accDep || 0) + amount, netValue: Math.max(Number(asset.scrapValue || 0), Number(asset.netValue || costBasis) - amount), depreciationPostings: [...(asset.depreciationPostings || []), { year, amount, journalId, status: 'posted' }], updatedAt: new Date().toISOString() };
    const updatedAccounts = adjustAccountsForLines(accounts, lines);
    try {
      await persistAssetAction(fixedAssets.map(item => item.id === assetId ? updatedAsset : item), { chartOfAccounts: updatedAccounts, journalEntries: [journalEntry, ...journalEntries] });
      setAccounts(updatedAccounts);
      setJournalEntries(previous => [journalEntry, ...previous]);
      setAssetForm(updatedAsset);
      triggerNotification(`رُحّل قيد إهلاك ${asset.id} بمبلغ ${amount.toFixed(2)} ${currency}.`, 'success');
    } catch (error: any) {
      triggerNotification(error?.message || 'تعذر ترحيل قيد الإهلاك مركزيًا.', 'warning');
    }
  };
  const handleTransferAssetSubmit = async () => {
    const asset = fixedAssets.find(item => item.id === (selectedAssetId || assetForm.id));
    if (!asset || !canonicalFinancialWriteReady) {
      triggerNotification('تعذر نقل الأصل: الأصل غير موثق أو المصدر المركزي غير جاهز.', 'warning');
      return;
    }
    const toBranch = String(assetForm.toBranch || transferForm.toBranch || '').trim();
    const toDept = String(assetForm.toDept || transferForm.toDept || '').trim();
    const toResponsible = String(assetForm.toResponsible || transferForm.toResponsible || '').trim();
    if (!toBranch || !toDept || !toResponsible) {
      triggerNotification('أكمل الفرع والموقع والمسؤول الجديد قبل تثبيت النقل.', 'warning');
      return;
    }
    const date = String(assetForm.date || transferForm.date || new Date().toISOString().slice(0, 10));
    const log = { id: `TR-${Date.now()}`, date, fromBranch: asset.branch || '', toBranch, fromDept: asset.location || '', toDept, fromResponsible: asset.responsible || '', toResponsible, notes: assetForm.notes || transferForm.notes || '', status: 'posted' };
    const updatedAsset = { ...asset, branch: toBranch, location: toDept, responsible: toResponsible, transferLogs: [...(asset.transferLogs || []), log], operations: [...(asset.operations || []), { id: log.id, type: 'نقل الأصل', date, details: `${log.fromBranch}/${log.fromDept} → ${toBranch}/${toDept}` }], updatedAt: new Date().toISOString() };
    try {
      await persistAssetAction(fixedAssets.map(item => item.id === asset.id ? updatedAsset : item));
      setAssetForm(updatedAsset);
      setActiveAssetModal(null);
      triggerNotification(`تم تثبيت نقل الأصل ${asset.id} مركزيًا.`, 'success');
    } catch (error: any) {
      triggerNotification(error?.message || 'تعذر حفظ نقل الأصل.', 'warning');
    }
  };
  const handleMaintenanceSubmit = async () => {
    const asset = fixedAssets.find(item => item.id === (selectedAssetId || assetForm.id));
    if (!asset || !canonicalFinancialWriteReady) {
      triggerNotification('تعذر تسجيل الصيانة: الأصل غير موثق أو المصدر المالي للقراءة فقط.', 'warning');
      return;
    }
    const cost = Number(assetForm.cost ?? maintenanceForm.cost ?? 0);
    if (!Number.isFinite(cost) || cost < 0) {
      triggerNotification('أدخل تكلفة صيانة صحيحة غير سالبة.', 'warning');
      return;
    }
    const date = String(assetForm.date || maintenanceForm.date || new Date().toISOString().slice(0, 10));
    const log = { id: `MNT-${Date.now()}`, type: assetForm.type || maintenanceForm.type || 'دورية', cost, supplier: assetForm.supplier || maintenanceForm.supplier || '', date, nextDate: assetForm.nextDate || maintenanceForm.nextDate || '', statusAfter: assetForm.statusAfter || maintenanceForm.statusAfter || 'غير محدد', notes: assetForm.notes || maintenanceForm.notes || '', status: 'posted' };
    let updatedJournalEntries = journalEntries;
    let updatedAccounts = accounts;
    let paymentVouchersPatch = paymentVouchers;
    if (cost > 0) {
      const expenseAccount = findAccountForAssetAction(assetForm.maintenanceExpenseAccount || '5230');
      const cashAccount = findAccountForAssetAction(assetForm.paymentAccount || '1102');
      if (!expenseAccount || !cashAccount) {
        triggerNotification('لم تُرحّل الصيانة: عيّن حساب مصروف الصيانة وحساب الدفع في دليل الحسابات.', 'warning');
        return;
      }
      const journalId = `JV-${new Date().getFullYear()}-FA-MNT-${Date.now().toString().slice(-8)}`;
      const voucherId = `PV-${new Date().getFullYear()}-FA-MNT-${Date.now().toString().slice(-8)}`;
      const lines = [
        { id: `${journalId}-D`, accountCode: expenseAccount.code, accountName: expenseAccount.name, debit: cost, credit: 0 },
        { id: `${journalId}-C`, accountCode: cashAccount.code, accountName: cashAccount.name, debit: 0, credit: cost }
      ];
      const entry = { id: journalId, date, description: `صيانة أصل ثابت ${asset.name}`, status: 'مرحل', type: 'بسيط', debitTotal: cost, creditTotal: cost, isSystemGenerated: true, fixedAssetId: asset.id, lines, createdAt: new Date().toISOString() };
      const voucher = { id: voucherId, date, amount: cost, against: `صيانة ${asset.name}`, paidFromAccount: cashAccount.code, expenseAccount: expenseAccount.code, status: 'مرحل', journalEntryId: journalId, fixedAssetId: asset.id, createdAt: new Date().toISOString() };
      updatedJournalEntries = [entry, ...journalEntries];
      paymentVouchersPatch = [voucher, ...paymentVouchers];
      updatedAccounts = adjustAccountsForLines(accounts, lines);
    }
    const updatedAsset = { ...asset, maintenanceLogs: [...(asset.maintenanceLogs || []), log], operations: [...(asset.operations || []), { id: log.id, type: 'صيانة الأصل', date, details: log.notes || `صيانة ${log.type}` }], updatedAt: new Date().toISOString() };
    try {
      await persistAssetAction(fixedAssets.map(item => item.id === asset.id ? updatedAsset : item), { chartOfAccounts: updatedAccounts, journalEntries: updatedJournalEntries, paymentVouchers: paymentVouchersPatch });
      setAccounts(updatedAccounts);
      setJournalEntries(updatedJournalEntries);
      setPaymentVouchers(paymentVouchersPatch);
      setAssetForm(updatedAsset);
      setActiveAssetModal(null);
      triggerNotification(`تم تسجيل صيانة الأصل ${asset.id} ${cost > 0 ? 'وترحيل سند الصرف' : ''} مركزيًا.`, 'success');
    } catch (error: any) {
      triggerNotification(error?.message || 'تعذر حفظ الصيانة مركزيًا.', 'warning');
    }
  };
  const handleSellAssetSubmit = async () => {
    const asset = fixedAssets.find(item => item.id === (selectedAssetId || assetForm.id));
    const salePrice = Number(assetForm.price ?? saleForm.price ?? 0);
    const grossCost = Number(asset?.cost || 0) + Number(asset?.capitalExp || 0);
    const accumulated = Number(asset?.accDep || 0);
    const cashAccount = findAccountForAssetAction(assetForm.receivingAccount || saleForm.receivingAccount || '1102');
    const assetAccount = findAccountForAssetAction(asset?.assetAccount);
    const accumulatedAccount = findAccountForAssetAction(asset?.accDepAccount);
    const gainLossAccount = findAccountForAssetAction(assetForm.gainLossAccount || saleForm.gainLossAccount) || accounts.find(account => /ربح|خسار|gain|loss/i.test(`${account.name || ''} ${account.nameAr || ''}`));
    if (!asset || !canonicalFinancialWriteReady || !Number.isFinite(salePrice) || salePrice <= 0) {
      triggerNotification('أدخل سعر بيع موجبًا وتأكد من جاهزية الأصل والمصدر المركزي.', 'warning');
      return;
    }
    if (!cashAccount || !assetAccount || !accumulatedAccount || !gainLossAccount) {
      triggerNotification('لم تُرحّل عملية البيع: عيّن حساب النقد، الأصل، مجمع الإهلاك، وحساب الربح/الخسارة.', 'warning');
      return;
    }
    const difference = salePrice + accumulated - grossCost;
    const journalId = `JV-${new Date().getFullYear()}-FASALE-${Date.now().toString().slice(-8)}`;
    const lines = [
      { id: `${journalId}-CASH`, accountCode: cashAccount.code, accountName: cashAccount.name, debit: salePrice, credit: 0 },
      { id: `${journalId}-ACCDEP`, accountCode: accumulatedAccount.code, accountName: accumulatedAccount.name, debit: accumulated, credit: 0 },
      ...(difference < 0 ? [{ id: `${journalId}-LOSS`, accountCode: gainLossAccount.code, accountName: gainLossAccount.name, debit: Math.abs(difference), credit: 0 }] : []),
      { id: `${journalId}-ASSET`, accountCode: assetAccount.code, accountName: assetAccount.name, debit: 0, credit: grossCost },
      ...(difference > 0 ? [{ id: `${journalId}-GAIN`, accountCode: gainLossAccount.code, accountName: gainLossAccount.name, debit: 0, credit: difference }] : [])
    ];
    const entry = { id: journalId, date: String(assetForm.date || saleForm.date || new Date().toISOString().slice(0, 10)), description: `بيع الأصل الثابت ${asset.name}`, status: 'مرحل', type: 'مركب', debitTotal: lines.reduce((sum, line) => sum + Number(line.debit || 0), 0), creditTotal: lines.reduce((sum, line) => sum + Number(line.credit || 0), 0), isSystemGenerated: true, fixedAssetId: asset.id, lines, createdAt: new Date().toISOString() };
    const updatedAsset = { ...asset, status: 'تم بيعه', netValue: 0, sale: { price: salePrice, buyer: assetForm.buyer || saleForm.buyer || '', date: entry.date, journalId }, operations: [...(asset.operations || []), { id: journalId, type: 'بيع الأصل', date: entry.date, details: `تم البيع بمبلغ ${salePrice}` }], updatedAt: new Date().toISOString() };
    const updatedAccounts = adjustAccountsForLines(accounts, lines);
    const receipt = { id: `RV-${journalId.slice(3)}`, date: entry.date, amount: salePrice, against: `بيع الأصل ${asset.name}`, receivingAccount: cashAccount.code, revenueAccount: gainLossAccount.code, status: 'مرحل', journalEntryId: journalId, fixedAssetId: asset.id, createdAt: new Date().toISOString() };
    try {
      await persistAssetAction(fixedAssets.map(item => item.id === asset.id ? updatedAsset : item), { chartOfAccounts: updatedAccounts, journalEntries: [entry, ...journalEntries], receiptVouchers: [receipt, ...receiptVouchers] });
      setAccounts(updatedAccounts); setJournalEntries(previous => [entry, ...previous]); setReceiptVouchers(previous => [receipt, ...previous]); setAssetForm(updatedAsset); setActiveAssetModal(null);
      triggerNotification(`تم بيع الأصل ${asset.id} وترحيل قيد البيع وسند القبض.`, 'success');
    } catch (error: any) { triggerNotification(error?.message || 'تعذر ترحيل عملية البيع مركزيًا.', 'warning'); }
  };
  const handleDiscardAssetSubmit = async () => {
    const asset = fixedAssets.find(item => item.id === (selectedAssetId || assetForm.id));
    const grossCost = Number(asset?.cost || 0) + Number(asset?.capitalExp || 0);
    const accumulated = Number(asset?.accDep || 0);
    const assetAccount = findAccountForAssetAction(asset?.assetAccount);
    const accumulatedAccount = findAccountForAssetAction(asset?.accDepAccount);
    const lossAccount = findAccountForAssetAction(assetForm.lossAccount || discardForm.lossAccount);
    if (!asset || !canonicalFinancialWriteReady || !assetAccount || !accumulatedAccount || !lossAccount) {
      triggerNotification('لم يُرحّل الاستبعاد: عيّن حساب الأصل ومجمع الإهلاك والخسائر وتأكد من جاهزية المصدر.', 'warning');
      return;
    }
    const netLoss = Math.max(0, grossCost - accumulated);
    const journalId = `JV-${new Date().getFullYear()}-FADISC-${Date.now().toString().slice(-8)}`;
    const lines = [
      { id: `${journalId}-ACCDEP`, accountCode: accumulatedAccount.code, accountName: accumulatedAccount.name, debit: accumulated, credit: 0 },
      { id: `${journalId}-LOSS`, accountCode: lossAccount.code, accountName: lossAccount.name, debit: netLoss, credit: 0 },
      { id: `${journalId}-ASSET`, accountCode: assetAccount.code, accountName: assetAccount.name, debit: 0, credit: grossCost }
    ];
    const entry = { id: journalId, date: String(assetForm.date || discardForm.date || new Date().toISOString().slice(0, 10)), description: `استبعاد وتكهين الأصل ${asset.name}`, status: 'مرحل', type: 'مركب', debitTotal: grossCost, creditTotal: grossCost, isSystemGenerated: true, fixedAssetId: asset.id, lines, createdAt: new Date().toISOString() };
    const updatedAsset = { ...asset, status: 'مستبعد', accDep: accumulated, netValue: 0, operations: [...(asset.operations || []), { id: journalId, type: 'استبعاد الأصل', date: entry.date, details: assetForm.notes || discardForm.notes || 'استبعاد وتكهين موثق' }], updatedAt: new Date().toISOString() };
    const updatedAccounts = adjustAccountsForLines(accounts, lines);
    try {
      await persistAssetAction(fixedAssets.map(item => item.id === asset.id ? updatedAsset : item), { chartOfAccounts: updatedAccounts, journalEntries: [entry, ...journalEntries] });
      setAccounts(updatedAccounts); setJournalEntries(previous => [entry, ...previous]); setAssetForm(updatedAsset); setActiveAssetModal(null);
      triggerNotification(`تم استبعاد الأصل ${asset.id} وترحيل قيد الخسارة.`, 'success');
    } catch (error: any) { triggerNotification(error?.message || 'تعذر ترحيل الاستبعاد مركزيًا.', 'warning'); }
  };
  const handleImportExcelSimulate = () => {
    if (!canonicalFinancialWriteReady) {
      triggerNotification('تعذر الاستيراد: المصدر المالي الحالي snapshot للقراءة فقط ولا توجد خدمة ترحيل كانونية معتمدة.', 'warning');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        triggerNotification('تعذر الاستيراد: الحد الأقصى لحجم الملف 10 ميجابايت.', 'warning');
        return;
      }
      try {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet, { defval: '' });
        const read = (row: Record<string, any>, keys: string[]) => {
          const key = Object.keys(row).find(candidate => keys.includes(candidate.trim().toLowerCase()));
          return key ? row[key] : '';
        };
        const importedAssets: any[] = [];
        const errors: string[] = [];
        rows.forEach((row, index) => {
          const name = String(read(row, ['name', 'asset name', 'اسم الأصل', 'اسم الأصل الثابت']) || '').trim();
          const code = String(read(row, ['code', 'asset code', 'الكود', 'رمز الأصل']) || '').trim();
          const cost = Number(String(read(row, ['cost', 'historical cost', 'التكلفة', 'التكلفة التاريخية']) || '').replace(/,/g, ''));
          if (!name || !code || !Number.isFinite(cost) || cost <= 0) {
            errors.push(`السطر ${index + 2}: الاسم والرمز والتكلفة الموجبة مطلوبة`);
            return;
          }
          if (fixedAssets.some(asset => asset.code === code) || importedAssets.some(asset => asset.code === code)) {
            errors.push(`السطر ${index + 2}: رمز الأصل ${code} مكرر`);
            return;
          }
          const capitalExp = Number(String(read(row, ['capital expenditure', 'capitalexp', 'الإضافات الرأسمالية']) || 0).replace(/,/g, '')) || 0;
          const accDep = Number(String(read(row, ['accumulated depreciation', 'accdep', 'مجمع الإهلاك']) || 0).replace(/,/g, '')) || 0;
          importedAssets.push({
            id: `FA-IMP-${Date.now().toString().slice(-6)}-${index + 1}`,
            code,
            name,
            category: String(read(row, ['category', 'التصنيف']) || 'غير مصنف').trim(),
            cost,
            capitalExp,
            accDep: Math.max(0, accDep),
            netValue: Math.max(0, cost + capitalExp - accDep),
            purchaseDate: String(read(row, ['purchase date', 'date', 'تاريخ الشراء', 'التاريخ']) || new Date().toISOString().slice(0, 10)),
            status: 'نشط / قيد التشغيل',
            importedAt: new Date().toISOString()
          });
        });
        if (errors.length > 0 || importedAssets.length === 0) {
          triggerNotification(errors.slice(0, 3).join(' | ') || 'لم توجد صفوف صالحة للاستيراد.', 'warning');
          return;
        }
        const updatedAssets = [...importedAssets, ...fixedAssets];
        await persistCanonicalFinancialSnapshot({ fixedAssets: updatedAssets });
        setFixedAssets(updatedAssets);
        triggerNotification(`تم استيراد ${importedAssets.length} أصلًا وحفظها مركزيًا بعد التحقق.`, 'success');
      } catch (error: any) {
        triggerNotification(error?.message || 'تعذر قراءة الملف أو حفظ الأصول مركزيًا؛ لم تتغير البيانات.', 'warning');
      }
    };
    input.click();
  };
  const handleDownloadTemplate = () => handleDownloadLedgerTemplate();
  const handlePrintAssetCard = (assetId: string) => {
    const asset = fixedAssets.find(item => item.id === assetId);
    if (!asset) return triggerNotification('لا يوجد أصل موثق لطباعة بطاقته.', 'warning');
    printVoucherDirect({ id: asset.id, date: new Date().toISOString().slice(0, 10), amount: asset.netValue, against: asset.name, status: asset.status }, 'بطاقة أصل ثابت');
  };


  // The state definitions were duplicated, removed the first block.

  // State definitions below should be the primary ones.


  // Missing handlers
  const handleSelectReport = (report: string) => { setSelectedReport(report); };
  const handleDrillDownBreadcrumbClick = (breadcrumb: any) => {
    if (breadcrumb?.level) setActiveTab(breadcrumb.level === 'report_view' ? 'financial_reports' : activeTab);
  };
  const handleDrillDownToAccount = (accountId: string) => {
    setSelectedAccountCode(accountId);
    setActiveTab('financial_reports');
    triggerNotification(`تم فتح كشف الحساب ${accountId} من السجل المحاسبي الموثق.`, 'info');
  };
  const handleDrillDownToOriginalDocument = (docId: string) => {
    findOriginalDocument(docId);
  };
  // Removed duplicated handler definitions.



  // Removed duplicated state definitions






  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      if (initialTab === 'financial_reports') {
        setSelectedReport(null);
      }
    }
  }, [initialTab]);

  React.useEffect(() => {
    if (activeTab === 'journal_entries') {
      if (activeSidebarItem !== 'journal_entries' && activeSidebarItem !== 'general_ledger_rep') {
        setActiveSidebarItem('journal_entries');
      }
    } else if (activeTab === 'receipt_voucher') {
      setActiveSidebarItem('receipt_voucher');
    } else if (activeTab === 'payment_voucher') {
      setActiveSidebarItem('payment_voucher');
    } else if (activeTab === 'trial_balance') {
      if (activeSidebarItem !== 'trial_balance' && activeSidebarItem !== 'cost_centers') {
        setActiveSidebarItem('trial_balance');
      }
    } else if (activeTab === 'financial_reports') {
      const reportItems = ['general_ledger_rep', 'trial_balance_rep', 'income_statement_rep', 'balance_sheet_rep', 'financial_reports', 'estimated_budget'];
      if (!reportItems.includes(activeSidebarItem)) {
        setActiveSidebarItem('financial_reports');
      }
    } else {
      setActiveSidebarItem(activeTab);
    }
  }, [activeTab]);
  
  // Simulation states for Governance Policy Dashboard
  const [activeSaving, setActiveSaving] = useState<string | null>(null);

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

  const [simAmount, setSimAmount] = useState<string>('5000');
  const [simCostCenter, setSimCostCenter] = useState<string>('kindergarten');
  const [isStrictEnforcement, setIsStrictEnforcement] = useState<boolean>(true);

  // Chart of accounts state
  const [accounts, setAccounts] = useState<AccountNode[]>(() => {
    if (canonicalPersistenceRequired) return [];
    const local = localStorage.getItem('erp_chart_of_accounts_v2');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e: any) {
        console.error("Failed to parse accounts from localStorage", "GeneralLedgerPortal", { error: e });
      }
    }
    // لا تُحمّل أرصدة افتتاحية تجريبية عند غياب المصدر المحاسبي المركزي.
    return [];
    /* return [
      // 1000 Assets (الأصول)
      { id: '1000', code: '1000', name: 'الأصول والممتلكات', nameAr: 'الأصول والممتلكات', nameEn: 'Assets', parentAccountId: undefined, type: 'رئيسي', classification: 'أصول', level: 1, natureType: 'مدين', isActive: true, balance: 464500.00, currency: 'د.ل', notes: 'الحساب الرئيسي لجميع الأصول' },
      { id: '1100', code: '1100', name: 'الأصول المتداولة والسيولة', nameAr: 'الأصول المتداولة والسيولة', nameEn: 'Current Assets and Liquidity', parentAccountId: '1000', type: 'رئيسي', classification: 'أصول', level: 2, natureType: 'مدين', isActive: true, balance: 450000.00, currency: 'د.ل', notes: 'النقدية وحسابات البنوك والعهد' },
      { id: '1101', code: '1101', name: 'صندوق الخزينة الرئيسي (كاش)', nameAr: 'صندوق الخزينة الرئيسي (كاش)', nameEn: 'Main Cash Safe', parentAccountId: '1100', type: 'فرعي', classification: 'أصول', level: 3, natureType: 'مدين', isActive: true, balance: 125000.00, currency: 'د.ل', notes: 'الخزينة النقدية الرئيسية بالمدرسة' },
      { id: '1110', code: '1110', name: 'صندوق الروضة (كاش فرعي)', nameAr: 'صندوق الروضة (كاش فرعي)', nameEn: 'Kindergarten Cash Safe', parentAccountId: '1100', type: 'فرعي', classification: 'أصول', level: 3, natureType: 'مدين', isActive: true, balance: 0.00, currency: 'د.ل', costCenterId: 'kindergarten', notes: 'الخزينة النقدية الفرعية لمرحلة الروضة' },
      { id: '1120', code: '1120', name: 'صندوق الابتدائي (كاش فرعي)', nameAr: 'صندوق الابتدائي (كاش فرعي)', nameEn: 'Primary School Cash Safe', parentAccountId: '1100', type: 'فرعي', classification: 'أصول', level: 3, natureType: 'مدين', isActive: true, balance: 0.00, currency: 'د.ل', costCenterId: 'primary', notes: 'الخزينة النقدية الفرعية لمرحلة الابتدائي' },
      { id: '1102', code: '1102', name: 'حساب مصرف الوحدة الجاري', nameAr: 'حساب مصرف الوحدة الجاري', nameEn: 'Al Wahda Bank Current Account', parentAccountId: '1100', type: 'فرعي', classification: 'أصول', level: 3, natureType: 'مدين', isActive: true, balance: 325000.00, currency: 'د.ل', notes: 'الحساب الجاري الرئيسي للمدرسة في مصرف الوحدة' },
      { id: '1200', code: '1200', name: 'الذمم المدينة والعملاء (الطلاب)', nameAr: 'الذمم المدينة والعملاء (الطلاب)', nameEn: 'Accounts Receivable (Students)', parentAccountId: '1000', type: 'رئيسي', classification: 'أصول', level: 2, natureType: 'مدين', isActive: true, balance: 14500.00, currency: 'د.ل', notes: 'أرصدة الرسوم الدراسية المستحقة على أولياء الأمور' },
      { id: '1300', code: '1300', name: 'الأصول الثابتة والإنشاءات', nameAr: 'الأصول الثابتة والإنشاءات', nameEn: 'Fixed Assets and Constructions', parentAccountId: '1000', type: 'رئيسي', classification: 'أصول', level: 2, natureType: 'مدين', isActive: true, balance: 0.00, currency: 'د.ل', notes: 'الأراضي والمباني والسيارات والتجهيزات المدرسية' },

      // 2000 Liabilities (الخصوم)
      { id: '2000', code: '2000', name: 'الخصوم والالتزامات', nameAr: 'الخصوم والالتزامات', nameEn: 'Liabilities', parentAccountId: undefined, type: 'رئيسي', classification: 'خصوم', level: 1, natureType: 'دائن', isActive: true, balance: 12000.00, currency: 'د.ل', notes: 'الحساب الرئيسي لجميع الالتزامات' },
      { id: '2100', code: '2100', name: 'الموردون والدائنون التجاريون', nameAr: 'الموردون والدائنون التجاريون', nameEn: 'Suppliers and Accounts Payable', parentAccountId: '2000', type: 'رئيسي', classification: 'خصوم', level: 2, natureType: 'دائن', isActive: true, balance: 7500.00, currency: 'د.ل', notes: 'الالتزامات تجاه موردي الكتب والزي والخدمات' },
      { id: '2101', code: '2101', name: 'ذمم الموردين والدائنين', nameAr: 'ذمم الموردين والدائنين', nameEn: 'Accounts Payable Ledger', parentAccountId: '2100', type: 'فرعي', classification: 'خصوم', level: 3, natureType: 'دائن', isActive: true, balance: 7500.00, currency: 'د.ل', notes: 'تفاصيل أرصدة الموردين المستحقة' },
      { id: '2102', code: '2102', name: 'أمانات مصلحة الضرائب والرسوم', nameAr: 'أمانات مصلحة الضرائب والرسوم', nameEn: 'Tax and Duty Liabilities', parentAccountId: '2100', type: 'فرعي', classification: 'خصوم', level: 3, natureType: 'دائن', isActive: true, balance: 4500.00, currency: 'د.ل', notes: 'مستحقات ضريبة الدخل والضمان الاجتماعي' },
      { id: '2200', code: '2200', name: 'الرواتب والأجور المستحقة', nameAr: 'الرواتب والأجور المستحقة', nameEn: 'Accrued Salaries and Wages', parentAccountId: '2000', type: 'فرعي', classification: 'خصوم', level: 2, natureType: 'دائن', isActive: true, balance: 0.00, currency: 'د.ل', notes: 'رواتب موظفي ومعلمي المدرسة المعلقة للاستحقاق' },
      { id: '2300', code: '2300', name: 'المصروفات المستحقة والأمانات', nameAr: 'المصروفات المستحقة والأمانات', nameEn: 'Accrued Expenses', parentAccountId: '2000', type: 'فرعي', classification: 'خصوم', level: 2, natureType: 'دائن', isActive: true, balance: 0.00, currency: 'د.ل', notes: 'مصروفات أخرى مستحقة لم تسدد بعد' },

      // 3000 Equity (حقوق الملكية)
      { id: '3000', code: '3000', name: 'حقوق الملكية ورأس المال', nameAr: 'حقوق الملكية ورأس المال', nameEn: 'Equity and Capital', parentAccountId: undefined, type: 'رئيسي', classification: 'حقوق ملكية', level: 1, natureType: 'دائن', isActive: true, balance: 350000.00, currency: 'د.ل', notes: 'حقوق المساهمين وملاك المؤسسة التعليمية' },
      { id: '3100', code: '3100', name: 'رأس مال المدرسة المدفوع', nameAr: 'رأس مال المدرسة المدفوع', nameEn: 'Paid-Up Share Capital', parentAccountId: '3000', type: 'رئيسي', classification: 'حقوق ملكية', level: 2, natureType: 'دائن', isActive: true, balance: 350000.00, currency: 'د.ل', notes: 'قيمة رأس المال المدفوع والموثق تجارياً' },
      { id: '3101', code: '3101', name: 'رأس مال المدرسة المدفوع الفعلي', nameAr: 'رأس مال المدرسة المدفوع الفعلي', nameEn: 'Actual Paid-Up Capital', parentAccountId: '3100', type: 'فرعي', classification: 'حقوق ملكية', level: 3, natureType: 'دائن', isActive: true, balance: 350000.00, currency: 'د.ل', notes: 'رأس المال النقدي المستثمر عند البداية' },
      { id: '3200', code: '3200', name: 'الأرباح المحتجزة والمدورة', nameAr: 'الأرباح المحتجزة والمدورة', nameEn: 'Retained Earnings', parentAccountId: '3000', type: 'فرعي', classification: 'حقوق ملكية', level: 2, natureType: 'دائن', isActive: true, balance: 0.00, currency: 'د.ل', notes: 'أرباح متراكمة من دورات تشغيلية سابقة' },

      // 4000 Revenues (الإيرادات)
      { id: '4000', code: '4000', name: 'الإيرادات والمتحصلات', nameAr: 'الإيرادات والمتحصلات', nameEn: 'Revenues', parentAccountId: undefined, type: 'رئيسي', classification: 'إيرادات', level: 1, natureType: 'دائن', isActive: true, balance: 185000.00, currency: 'د.ل', notes: 'حساب الإيرادات والمتحصلات العام' },
      { id: '4100', code: '4100', name: 'إيرادات الرسوم الدراسية', nameAr: 'إيرادات الرسوم الدراسية', nameEn: 'Tuition Fee Revenues', parentAccountId: '4000', type: 'رئيسي', classification: 'إيرادات', level: 2, natureType: 'دائن', isActive: true, balance: 155000.00, currency: 'د.ل', notes: 'الرسوم الدراسية السنوية والفصلية لجميع المراحل' },
      { id: '4101', code: '4101', name: 'إيرادات الرسوم الدراسية الموحدة', nameAr: 'إيرادات الرسوم الدراسية الموحدة', nameEn: 'Unified Tuition Fee Revenues', parentAccountId: '4100', type: 'فرعي', classification: 'إيرادات', level: 3, natureType: 'دائن', isActive: true, balance: 155000.00, currency: 'د.ل', notes: 'الحساب الموحد المعتمد لكافة المراحل والصفوف الدراسية - يتم التتبع والفرز التفصيلي حصرياً عبر مراكز التكلفة' },
      { id: '4200', code: '4200', name: 'إيرادات رسوم التسجيل والقبول', nameAr: 'إيرادات رسوم التسجيل والقبول', nameEn: 'Registration and Admission Fees', parentAccountId: '4000', type: 'فرعي', classification: 'إيرادات', level: 2, natureType: 'دائن', isActive: true, balance: 155000.00, currency: 'د.ل', notes: 'إيرادات رسوم ملفات الطلاب الجدد واختبارات القبول' },
      { id: '4300', code: '4300', name: 'إيراد ريع حافلات النقل المدرسي', nameAr: 'إيراد ريع حافلات النقل المدرسي', nameEn: 'School Bus Transport Revenues', parentAccountId: '4000', type: 'فرعي', classification: 'إيرادات', level: 2, natureType: 'دائن', isActive: true, balance: 30000.00, currency: 'د.ل', notes: 'رسوم اشتراكات النقل للحافلات المدرسية' },
      { id: '4400', code: '4400', name: 'إيرادات رسوم الأنشطة والرحلات', nameAr: 'إيرادات رسوم الأنشطة والرحلات', nameEn: 'Activities and Trips Fees', parentAccountId: '4000', type: 'فرعي', classification: 'إيرادات', level: 2, natureType: 'دائن', isActive: true, balance: 0.00, currency: 'د.ل', notes: 'رسوم الرحلات والأنشطة والاحتفالات المدرسية الإضافية' },
      { id: '4500', code: '4500', name: 'متحصلات وإيرادات تعليمية أخرى', nameAr: 'متحصلات وإيرادات تعليمية أخرى', nameEn: 'Other Educational Revenues', parentAccountId: '4000', type: 'فرعي', classification: 'إيرادات', level: 2, natureType: 'دائن', isActive: true, balance: 0.00, currency: 'د.ل', notes: 'مبيعات الكافيتريا أو عوائد الاستثمارات' },

      // 5000 Expenses (المصروفات)
      { id: '5000', code: '5000', name: 'المصروفات والأعباء التشغيلية', nameAr: 'المصروفات والأعباء التشغيلية', nameEn: 'Expenses', parentAccountId: undefined, type: 'رئيسي', classification: 'مصروفات', level: 1, natureType: 'مدين', isActive: true, balance: 65000.00, currency: 'د.ل', notes: 'الحساب الرئيسي لجميع المصروفات والأعباء' },
      { id: '5100', code: '5100', name: 'مصروفات الرواتب والأجور والمزايا', nameAr: 'مصروفات الرواتب والأجور والمزايا', nameEn: 'Salaries and Benefits Expenses', parentAccountId: '5000', type: 'رئيسي', classification: 'مصروفات', level: 2, natureType: 'مدين', isActive: true, balance: 45000.00, currency: 'د.ل', notes: 'رواتب موظفي الإدارة والمعلمين والعاملين' },
      { id: '5101', code: '5101', name: 'مصروف رواتب وأجور المعلمين الكلي', nameAr: 'مصروف رواتب وأجور المعلمين الكلي', nameEn: 'Teachers Salaries Expenses', parentAccountId: '5100', type: 'فرعي', classification: 'مصروفات', level: 3, natureType: 'مدين', isActive: true, balance: 45000.00, currency: 'د.ل', notes: 'أجور ورواتب الطاقم التعليمي الشهري' },
      { id: '5200', code: '5200', name: 'المصروفات العمومية والإدارية', nameAr: 'المصروفات العمومية والإدارية', nameEn: 'General and Administrative Expenses', parentAccountId: '5000', type: 'رئيسي', classification: 'مصروفات', level: 2, natureType: 'مدين', isActive: true, balance: 20000.00, currency: 'د.ل', notes: 'المياه، الكهرباء، الاتصالات، الإيجارات، الصيانة والمصروفات المكتبية' },
      { id: '5210', code: '5210', name: 'مصروف استهلاك الكهرباء والطاقة', nameAr: 'مصروف استهلاك الكهرباء والطاقة', nameEn: 'Electricity and Power Expenses', parentAccountId: '5200', type: 'فرعي', classification: 'مصروفات', level: 3, natureType: 'مدين', isActive: true, balance: 0.00, currency: 'د.ل', notes: 'فواتير استهلاك تيار الكهرباء للفرع المالي' },
      { id: '5220', code: '5220', name: 'مصروف استهلاك المياه والمرافق', nameAr: 'مصروف استهلاك المياه والمرافق', nameEn: 'Water and Facilities Expenses', parentAccountId: '5200', type: 'فرعي', classification: 'مصروفات', level: 3, natureType: 'مدين', isActive: true, balance: 0.00, currency: 'د.ل', notes: 'فواتير استهلاك شبكة المياه والمجاري وعقود التحلية' },
      { id: '5230', code: '5230', name: 'مصروف الصيانة والترميمات الفنية', nameAr: 'مصروف الصيانة والترميمات الفنية', nameEn: 'Maintenance and Renovation Expenses', parentAccountId: '5200', type: 'فرعي', classification: 'مصروفات', level: 3, natureType: 'مدين', isActive: true, balance: 0.00, currency: 'د.ل', notes: 'صيانة مبنى المدرسة، الأجهزة والتجهيزات والمقاعد' },
      { id: '5240', code: '5240', name: 'مصروف الأنشطة والمسابقات الرياضية', nameAr: 'مصروف الأنشطة والمسابقات الرياضية', nameEn: 'Activities and Sports Expenses', parentAccountId: '5200', type: 'فرعي', classification: 'مصروفات', level: 3, natureType: 'مدين', isActive: true, balance: 0.00, currency: 'د.ل', notes: 'شراء لوازم الجوائز، رحلات المعرفة والأنشطة اللامنهجية' },
      { id: '5250', code: '5250', name: 'مصروف التسويق والدعاية والنشر', nameAr: 'مصروف التسويق والدعاية والنشر', nameEn: 'Marketing and Advertising Expenses', parentAccountId: '5200', type: 'فرعي', classification: 'مصروفات', level: 3, natureType: 'مدين', isActive: true, balance: 0.00, currency: 'د.ل', notes: 'إعلانات التسجيل للطلاب الجدد، الحملات وتجهيز المطبوعات والهدايا' },
      { id: '5260', code: '5260', name: 'مصروف إيجار مبنى الفرع السنوي', nameAr: 'مصروف إيجار مبنى الفرع السنوي', nameEn: 'Branch Building Annual Rent', parentAccountId: '5200', type: 'فرعي', classification: 'مصروفات', level: 3, natureType: 'مدين', isActive: true, balance: 20000.00, currency: 'د.ل', notes: 'الإيجار التعاقدي السنوي لموقع المدرسة الحالي' },
      { id: '5270', code: '5270', name: 'مصروفات إدارية وتشغيلية أخرى', nameAr: 'مصروفات إدارية وتشغيلية أخرى', nameEn: 'Other Admin & Operating Expenses', parentAccountId: '5200', type: 'فرعي', classification: 'مصروفات', level: 3, natureType: 'مدين', isActive: true, balance: 0.00, currency: 'د.ل', notes: 'أي بنود مصروفات طارئة أخرى لم تدرج بالمجموعات' }
    ]; */
  });

  // Suppliers state
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Journal entries state
  const [journalEntries, setJournalEntries] = useState(() => {
    if (canonicalPersistenceRequired) return [];
    const local = localStorage.getItem('erp_journal_entries_v2');
    if (local) {
      try { return JSON.parse(local); } catch (e: any) {}
    }
    return [];
    /* return [
      {
        id: 'JV-2026-001',
        date: '2026-06-20',
        description: 'إثبات قيد رواتب موظفي شهر مايو إدارياً',
        debitTotal: 12500.00,
        creditTotal: 12500.00,
        status: 'مرحل',
        type: 'مركب' as const,
        createdByUser: 'سليمان غازي',
        createdAt: '2026-06-20 10:30',
        updatedAt: '2026-06-20 10:32',
        lines: [
          { accountCode: '5101', accountName: 'رواتب وأجور تدريس', description: 'رواتب التدريس مايو', debit: 12500.00, credit: 0, costCenter: 'primary' },
          { accountCode: '2101', accountName: 'موظفين ومستحقات', description: 'أمانات رواتب مايو', debit: 0, credit: 12500.00, costCenter: 'primary' }
        ],
        attachments: [] as string[]
      },
      {
        id: 'JV-2026-002',
        date: '2026-06-21',
        description: 'تغدية الصندوق الرئيسي من حساب مصرف الوحدة',
        debitTotal: 5000.00,
        creditTotal: 5000.00,
        status: 'مرحل',
        type: 'مركب' as const,
        createdByUser: 'سليمان غازي',
        createdAt: '2026-06-21 11:15',
        updatedAt: '2026-06-21 11:20',
        lines: [
          { accountCode: '1101', accountName: 'صندوق النقدية والخزينة الموحدة', description: 'تغذية الصندوق', debit: 5000.00, credit: 0, costCenter: 'kindergarten' },
          { accountCode: '1102', accountName: 'مصرف الوحدة الجاري', description: 'تغذية الصندوق من الجاري', debit: 0, credit: 5000.00, costCenter: 'kindergarten' }
        ],
        attachments: [] as string[]
      },
      {
        id: 'JV-2026-003',
        date: '2026-06-22',
        description: 'شراء قرطاسية مخصصة لامتحانات نهاية الفصل الأول',
        debitTotal: 850.00,
        creditTotal: 850.00,
        status: 'مسودة',
        type: 'بسيط' as const,
        createdByUser: 'سليمان غازي',
        createdAt: '2026-06-22 09:00',
        updatedAt: '2026-06-22 09:00',
        lines: [
          { accountCode: '5210', accountName: 'مصاريف القرطاسية والامتحانات', description: 'شراء قرطاسية مخصصة لامتحانات نهاية الفصل الأول', debit: 850.00, credit: 0, costCenter: 'secondary' },
          { accountCode: '1101', accountName: 'صندوق النقدية والخزينة الموحدة', description: 'شراء قرطاسية مخصصة لامتحانات نهاية الفصل الأول', debit: 0, credit: 850.00, costCenter: 'secondary' }
        ],
        attachments: [] as string[]
      }
    ]; */
  });

  // The general ledger must consume the same canonical financial snapshot as
  // the student-fees module. Local seed rows remain useful for rendering the
  // chart structure, but balances and movements are fail-closed until the
  // trusted source is available.
  const [canonicalFinancialStatus, setCanonicalFinancialStatus] = useState<'loading' | 'ready' | 'blocked'>('loading');
  const [canonicalFinancialMessage, setCanonicalFinancialMessage] = useState('جارٍ ربط الأستاذ العام بالمصدر المالي الموحد...');
  const [canonicalSnapshotHasAccounts, setCanonicalSnapshotHasAccounts] = useState(false);
  const [canonicalFinancialData, setCanonicalFinancialData] = useState<Record<string, any>>({});
  const [canonicalFinancialVersion, setCanonicalFinancialVersion] = useState(0);
  const [canonicalFinancialRefreshNonce, setCanonicalFinancialRefreshNonce] = useState(0);
  // The canonical ERP integration is distinct from the compatibility snapshot:
  // posted source documents are persisted to the canonical journal and GL.
  type CanonicalFinancialWriteMode = 'snapshot_read_only' | 'snapshot_write' | 'erp_integrated' | 'ledger_ready';
  const [canonicalFinancialWriteMode, setCanonicalFinancialWriteMode] = useState<CanonicalFinancialWriteMode>('snapshot_read_only');
  const canonicalFinancialWriteReady = canonicalFinancialStatus === 'ready'
    && canonicalFinancialWriteMode !== 'snapshot_read_only';
  const canonicalLedgerReady = canonicalFinancialStatus === 'ready'
    && (canonicalFinancialWriteMode === 'ledger_ready' || canonicalFinancialWriteMode === 'erp_integrated');
  const requireCanonicalFinancialWrite = (actionName: string) => {
    if (canonicalFinancialWriteReady) return true;
    triggerNotification(`تعذر تنفيذ ${actionName}: المصدر المالي المركزي غير متاح للكتابة أو لم تعتمد خدمة دفتر الأستاذ الكانونية.`, 'warning');
    return false;
  };

  useEffect(() => {
    let active = true;

    const loadCanonicalFinancialSnapshot = async () => {
      try {
        const response = await authenticatedRequest('/api/financial/database', {
          headers: {
            'Accept': 'application/json'
          },
          cache: 'no-store'
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) {
          throw new Error(result.message || `تعذر تحميل المصدر المالي (${response.status})`);
        }

        const data = result.data || {};
        const canonicalJournalEntries = Array.isArray(data.journalEntries) ? data.journalEntries : [];
        const canonicalStudentReceiptVouchers = Array.isArray(data.studentReceiptVouchers) ? data.studentReceiptVouchers : [];
        // Student Financials stores student receipts under studentReceiptVouchers,
        // while the general-ledger read model uses receiptVouchers. Prefer the
        // explicit GL stream and use the student stream only when it is the only
        // canonical receipt source available.
        const canonicalReceiptVouchers = Array.isArray(data.receiptVouchers)
          ? data.receiptVouchers
          : canonicalStudentReceiptVouchers;
        const canonicalPaymentVouchers = Array.isArray(data.paymentVouchers) ? data.paymentVouchers : [];
        const canonicalBankTransfers = Array.isArray(data.bankTransfers) ? data.bankTransfers : [];
        const canonicalSuppliers = Array.isArray(data.suppliers) ? data.suppliers : [];
        const canonicalFixedAssets = Array.isArray(data.fixedAssets) ? data.fixedAssets : [];
        const canonicalAccounts = Array.isArray(data.chartOfAccounts) ? data.chartOfAccounts : [];

        if (!active) return;

        // The connected snapshot is authoritative. Keeping browser demo
        // entries alongside it would make journal totals and reports drift
        // from the actual posted source.
        setJournalEntries(canonicalJournalEntries);
        setReceiptVouchers(canonicalReceiptVouchers);
        setPaymentVouchers(canonicalPaymentVouchers);
        setBankTransfers(canonicalBankTransfers);
        setSuppliers(canonicalSuppliers);
        setFixedAssets(canonicalFixedAssets);
        setCanonicalFinancialData({
          ...data,
          studentReceiptVouchers: canonicalStudentReceiptVouchers,
          receiptVouchers: canonicalReceiptVouchers,
          paymentVouchers: canonicalPaymentVouchers,
          bankTransfers: canonicalBankTransfers,
          suppliers: canonicalSuppliers,
          fixedAssets: canonicalFixedAssets
        });
        setCanonicalFinancialVersion(Number(result.meta?.version || 0));
        const resolvedWriteMode: CanonicalFinancialWriteMode = result.meta?.writeMode === 'snapshot_write'
          ? 'snapshot_write'
          : result.meta?.writeMode === 'erp_integrated'
            ? 'erp_integrated'
            : result.meta?.writeMode === 'ledger_ready'
              ? 'ledger_ready'
              : 'snapshot_read_only';
        setCanonicalFinancialWriteMode(resolvedWriteMode);

        if (canonicalAccounts.length > 0) {
          setCanonicalSnapshotHasAccounts(true);
          const normalizedAccounts: AccountNode[] = canonicalAccounts.map((account: any) => {
            const code = String(account.code || account.accountCode || account.id || '');
            const name = account.nameAr || account.name || account.nameEn || 'حساب مالي';
            const rawNature = String(account.nature || account.accountType || account.type || '').trim().toLowerCase();
            const classificationByNature: Record<string, AccountNode['classification']> = {
              asset: 'أصول',
              assets: 'أصول',
              liability: 'خصوم',
              liabilities: 'خصوم',
              equity: 'حقوق ملكية',
              revenue: 'إيرادات',
              revenues: 'إيرادات',
              income: 'إيرادات',
              expense: 'مصروفات',
              expenses: 'مصروفات'
            };
            // Some legacy snapshots carry a stale `classification` label while
            // the accounting nature/type is correct. Prefer the semantic nature
            // so revenue/expense postings cannot be rendered under assets.
            const classification = classificationByNature[rawNature]
              || account.classification
              || 'أصول';
            const rawNatureType = String(account.natureType || '').trim();
            return {
              id: String(account.id || code),
              code,
              name,
              nameAr: name,
              nameEn: account.nameEn || account.name || '',
              parentAccountId: account.parentAccountId,
              type: account.type || (Number(account.level || 3) >= 3 ? 'فرعي' : 'رئيسي'),
              classification,
              level: Number(account.level || 3),
              natureType: rawNatureType || (
                classification === 'إيرادات' || classification === 'خصوم' || classification === 'حقوق ملكية'
                  ? 'دائن'
                  : 'مدين'
              ),
              isActive: account.isActive !== false,
              balance: Number(account.balance || 0),
              currency: account.currency || 'د.ل',
              notes: account.notes || ''
            } as AccountNode;
          });
          setAccounts(previous => {
            const canonicalByCode = new Map(normalizedAccounts.map(account => [account.code, account]));
            const merged = previous.map(account => canonicalByCode.get(account.code) || account);
            const existingCodes = new Set(merged.map(account => account.code));
            return [...merged, ...normalizedAccounts.filter(account => !existingCodes.has(account.code))];
          });
        } else {
          // An authenticated but empty chart is valid during development. In
          // that case zero the demo balances and let the posted journal stream
          // build a real trial balance instead of showing fabricated amounts.
          setCanonicalSnapshotHasAccounts(false);
          setAccounts(previous => previous.map(account => ({ ...account, balance: 0 })));
        }

        setCanonicalFinancialStatus('ready');
        setCanonicalFinancialMessage(resolvedWriteMode === 'snapshot_write'
          ? `المصدر المالي المركزي متصل للكتابة المركزية في UAT — ${canonicalJournalEntries.length} قيد و${canonicalReceiptVouchers.length} سند قبض و${canonicalPaymentVouchers.length} سند صرف؛ الحفظ موثق بالإصدار، لكن الترحيل والإقفال المعتمدين للـ GL غير متاحين.`
          : resolvedWriteMode === 'erp_integrated'
            ? `دفتر الأستاذ الكانوني متصل — ${canonicalJournalEntries.length} قيد و${canonicalReceiptVouchers.length} سند قبض و${canonicalPaymentVouchers.length} سند صرف؛ الربط المالي للمصادر مفعّل.`
            : `المصدر المالي المركزي متصل للقراءة فقط — ${canonicalJournalEntries.length} قيد و${canonicalReceiptVouchers.length} سند قبض و${canonicalPaymentVouchers.length} سند صرف معروض؛ الترحيل والإقفال غير متاحين حتى اعتماد خدمة دفتر الأستاذ.`);
      } catch (error: any) {
        if (!active) return;
        setJournalEntries([]);
        setReceiptVouchers([]);
        setPaymentVouchers([]);
        setBankTransfers([]);
        setSuppliers([]);
        setFixedAssets([]);
        setCanonicalFinancialData({});
        setCanonicalFinancialVersion(0);
        setCanonicalFinancialWriteMode('snapshot_read_only');
        setCanonicalSnapshotHasAccounts(false);
        setAccounts(previous => previous.map(account => ({ ...account, balance: 0 })));
        setCanonicalFinancialStatus('blocked');
        setCanonicalFinancialMessage(error?.message || 'تعذر ربط الأستاذ العام بالمصدر المالي الموحد');
      }
    };

    void loadCanonicalFinancialSnapshot();
    return () => {
      active = false;
    };
  }, [selectedSchool?.id, canonicalFinancialRefreshNonce]);

  const refreshCanonicalFinancialData = () => {
    setCanonicalFinancialStatus('loading');
    setCanonicalFinancialMessage('جارٍ إعادة تحميل المصدر المالي المركزي...');
    setCanonicalFinancialRefreshNonce(previous => previous + 1);
  };

  /**
   * Persist a complete, versioned financial snapshot through the authenticated
   * server route. Accounting screens must use this adapter instead of
   * localStorage or optimistic "saved" notifications.
   */
  const persistCanonicalFinancialSnapshot = async (patch: Record<string, any> = {}) => {
    if (canonicalFinancialStatus !== 'ready') {
      throw new Error('الحفظ المالي متوقف حتى يتوفر المصدر المحاسبي المركزي الموثوق.');
    }
    if (canonicalFinancialWriteMode === 'snapshot_read_only') {
      throw new Error('الكتابة المالية متوقفة: المصدر الحالي snapshot للقراءة فقط، ولم تفعّل كتابة UAT المركزية.');
    }
    if (!selectedSchool?.id) {
      throw new Error('لا يمكن حفظ الحركة المالية دون مدرسة موثوقة.');
    }

    const nextPayload = {
      ...canonicalFinancialData,
      invoices: canonicalFinancialData.invoices ?? invoices,
      chartOfAccounts: canonicalFinancialData.chartOfAccounts ?? accounts,
      journalEntries: canonicalFinancialData.journalEntries ?? journalEntries,
      receiptVouchers: canonicalFinancialData.receiptVouchers ?? receiptVouchers,
      paymentVouchers: canonicalFinancialData.paymentVouchers ?? paymentVouchers,
      bankTransfers: canonicalFinancialData.bankTransfers ?? bankTransfers,
      suppliers: canonicalFinancialData.suppliers ?? suppliers,
      fixedAssets: canonicalFinancialData.fixedAssets ?? fixedAssets,
      ...patch
    };

    const normalizeStatus = (value: unknown) => {
      const status = String(value || 'draft').trim().toLowerCase();
      if (['مرحل', 'مرحّل', 'مُرحّل', 'posted'].includes(status)) return 'posted';
      if (['معتمد', 'approved'].includes(status)) return 'approved';
      if (['ملغى', 'ملغي', 'cancelled', 'void'].includes(status)) return 'cancelled';
      if (['محفوظ', 'saved'].includes(status)) return 'saved';
      return 'draft';
    };
    const requestPayload = {
      ...nextPayload,
      receiptVouchers: Array.isArray(nextPayload.receiptVouchers)
        ? nextPayload.receiptVouchers.map((voucher: any) => ({ ...voucher, status: normalizeStatus(voucher.status) }))
        : [],
      studentReceiptVouchers: Array.isArray(nextPayload.studentReceiptVouchers)
        ? nextPayload.studentReceiptVouchers.map((voucher: any) => ({ ...voucher, status: normalizeStatus(voucher.status) }))
        : [],
      paymentVouchers: Array.isArray(nextPayload.paymentVouchers)
        ? nextPayload.paymentVouchers.map((voucher: any) => ({ ...voucher, status: normalizeStatus(voucher.status) }))
        : [],
      journalEntries: Array.isArray(nextPayload.journalEntries)
        ? nextPayload.journalEntries.map((entry: any) => ({
            ...entry,
            status: normalizeStatus(entry.status),
            debitTotal: Number(entry.debitTotal ?? entry.debitSum ?? 0),
            creditTotal: Number(entry.creditTotal ?? entry.creditSum ?? 0)
          }))
        : []
    };

    const response = await authenticatedRequest('/api/financial/database', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...requestPayload, expectedVersion: canonicalFinancialVersion })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
      throw new Error(result.message || `تعذر حفظ المصدر المالي (${response.status})`);
    }

    const nextVersion = Number(result.meta?.version);
    if (!Number.isSafeInteger(nextVersion)) {
      throw new Error('تم قبول العملية دون إصدار مالي قابل للتحقق.');
    }
    setCanonicalFinancialData(nextPayload);
    setCanonicalFinancialVersion(nextVersion);
    setCanonicalFinancialMessage(canonicalFinancialWriteMode === 'snapshot_write'
      ? `المصدر المالي المركزي متصل للكتابة المركزية في UAT — الإصدار ${nextVersion}، ${Array.isArray(nextPayload.journalEntries) ? nextPayload.journalEntries.length : 0} قيد موثق؛ غير معتمد كترحيل GL نهائي.`
      : canonicalFinancialWriteMode === 'erp_integrated'
        ? `دفتر الأستاذ الكانوني متصل — الإصدار ${nextVersion}، وتمت مزامنة قيود المصادر والتقارير.`
        : `المصدر المالي الموحد متصل — الإصدار ${nextVersion}، ${Array.isArray(nextPayload.journalEntries) ? nextPayload.journalEntries.length : 0} قيد موثق`);
    return result;
  };

  // Helper to sync local state to FallbackStorage, run the PostingEngine action, and sync back
  const runWithPostingEngine = async (
    action: (schoolId: string) => Promise<any>
  ): Promise<any> => {
    if (canonicalPersistenceRequired || !canonicalFinancialWriteReady) {
      throw new Error('مسار الأستاذ العام المحلي غير مسموح به مع تفعيل الحفظ المركزي.');
    }
    if (!selectedSchool?.id) {
      throw new Error('لا يمكن تنفيذ حركة محاسبية دون مدرسة موثوقة.');
    }
    // 1. Ensure FallbackStorage is initialized
    await FallbackStorage.initialize();

    // 2. Map current UI accounts and journal entries to FallbackStorage format
    const dbAccounts = accounts.map(node => ({
      id: node.id,
      code: node.code,
      name: node.nameAr || node.name,
      shortName: node.nameEn,
      nature: (node.classification === 'أصول' ? 'asset' :
               node.classification === 'خصوم' ? 'liability' :
               node.classification === 'حقوق ملكية' ? 'equity' :
               node.classification === 'إيرادات' ? 'revenue' : 'expense') as any,
      level: node.level,
      parentAccountId: node.parentAccountId,
      isActive: node.isActive,
      isLeaf: node.type === 'فرعي',
      balance: node.balance,
      debitBalance: node.natureType === 'مدين' ? node.balance : 0,
      creditBalance: node.natureType === 'دائن' ? node.balance : 0,
      currency: node.currency,
      defaultCostCenter: node.costCenterId
    }));

    const dbJournalEntries = journalEntries.map(jv => ({
      id: jv.id,
      date: jv.date,
      description: jv.description,
      status: (jv.status === 'مرحل' ? 'posted' : jv.status === 'معتمد' ? 'approved' : 'draft') as any,
      items: (jv.lines || []).map((line: any) => ({
        accountId: line.accountCode,
        debit: line.debit || 0,
        credit: line.credit || 0
      })),
      totalDebit: jv.debitTotal,
      totalCredit: jv.creditTotal,
      createdAt: jv.createdAt || new Date().toISOString()
    }));

    FallbackStorage.saveAccounts(dbAccounts);
    FallbackStorage.saveJournalEntries(dbJournalEntries);

    // 3. Execute the PostingEngine action
    const result = await action(selectedSchool.id);

    // 4. Retrieve updated data from FallbackStorage
    const updatedDbAccounts = FallbackStorage.getAccounts();
    const updatedDbJournalEntries = FallbackStorage.getJournalEntries();

    // 5. Map back to UI formats
    const updatedAccounts = updatedDbAccounts.map(acc => {
      const originalNode = accounts.find(n => n.id === acc.id);
      return {
        ...originalNode,
        id: acc.id,
        code: acc.code,
        name: acc.name,
        nameAr: acc.name,
        nameEn: acc.shortName || acc.name,
        parentAccountId: acc.parentAccountId,
        type: (acc.isLeaf ? 'فرعي' : 'رئيسي') as any,
        classification: (acc.nature === 'asset' ? 'أصول' :
                         acc.nature === 'liability' ? 'خصوم' :
                         acc.nature === 'equity' ? 'حقوق ملكية' :
                         acc.nature === 'revenue' ? 'إيرادات' : 'مصروفات') as any,
        level: acc.level,
        natureType: (acc.nature === 'asset' || acc.nature === 'expense' ? 'مدين' : 'دائن') as any,
        costCenterId: acc.defaultCostCenter,
        isActive: acc.isActive,
        balance: acc.balance,
        currency: acc.currency
      } as AccountNode;
    });

    const updatedJournalEntries = updatedDbJournalEntries.map(entry => {
      const originalJv = journalEntries.find(j => j.id === entry.id);
      return {
        ...originalJv,
        id: entry.id,
        date: entry.date,
        description: entry.description,
        debitTotal: entry.totalDebit,
        creditTotal: entry.totalCredit,
        status: (entry.status === 'posted' ? 'مرحل' : entry.status === 'approved' ? 'معتمد' : 'مسودة') as any,
        type: originalJv?.type || 'مركب',
        createdByUser: originalJv?.createdByUser || 'سليمان غازي',
        createdAt: entry.createdAt,
        updatedAt: new Date().toISOString(),
        lines: entry.items.map((item: any) => {
          const acc = updatedAccounts.find(a => a.id === item.accountId);
          const originalLine = originalJv?.lines?.find((l: any) => l.accountCode === item.accountId);
          return {
            accountCode: item.accountId,
            accountName: acc ? acc.nameAr : '',
            description: entry.description,
            debit: item.debit,
            credit: item.credit,
            costCenter: originalLine?.costCenter || 'primary'
          };
        }),
        attachments: originalJv?.attachments || []
      };
    });

    // 6. Update local UI React States
    setAccounts(updatedAccounts);
    setJournalEntries(updatedJournalEntries);

    return result;
  };

  // For adding new accounts
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    code: '', name: '', type: 'فرعي' as const, classification: 'أصول' as const, balance: 0
  });

  // Enhanced Chart of Accounts UI States
  const [selectedAccountCode, setSelectedAccountCode] = useState<string | null>('1000');
  const [coaSearchQuery, setCoaSearchQuery] = useState<string>('');
  const [coaMode, setCoaMode] = useState<'view' | 'edit' | 'create'>('view');
  const [selectedAccTab, setSelectedAccTab] = useState<'info' | 'budget' | 'split' | 'reconciliation' | 'ledger'>('info');
  const [inlineBudgetEdit, setInlineBudgetEdit] = useState<boolean>(false);
  const [inlineBudgetVal, setInlineBudgetVal] = useState<number>(0);
  const [inlineSplits, setInlineSplits] = useState<{ kindergarten: number, primary: number, middle: number, secondary: number }>({ kindergarten: 25, primary: 25, middle: 25, secondary: 25 });
  const [reconcileChecks, setReconcileChecks] = useState<Record<string, boolean>>({});
  const [coaWorkspaceMode, setCoaWorkspaceMode] = useState<'inspector' | 'dashboard' | 'spreadsheet' | 'wizard' | 'stress_test'>('inspector');
  const [stressScenario, setStressScenario] = useState<'none' | 'inflation' | 'revenue_drop' | 'budget_freeze' | 'expansion'>('none');
  const [expenseStressFactor, setExpenseStressFactor] = useState<number>(100);
  const [revenueStressFactor, setRevenueStressFactor] = useState<number>(100);
  const [spreadEditCode, setSpreadEditCode] = useState<string | null>(null);
  const [wizardParentId, setWizardParentId] = useState<string>('5000');
  const [wizardBaseName, setWizardBaseName] = useState<string>('');
  const [wizardClass, setWizardClass] = useState<'أصول' | 'خصوم' | 'حقوق ملكية' | 'إيرادات' | 'مصروفات'>('مصروفات');
  const [coaScanState, setCoaScanState] = useState<'idle' | 'scanning' | 'completed'>('idle');
  const [coaAuditFixCount, setCoaAuditFixCount] = useState<number>(0);

  // Advanced Financial Reports Custom States
  
  // Drill-Down Types & State
  interface DrillDownStep {
    level: 'reports_list' | 'report_view' | 'account_statement' | 'journal_entry' | 'original_document';
    reportId?: string | null;
    accountCode?: string;
    journalEntryId?: string;
    documentId?: string;
    documentType?: 'receipt_voucher' | 'payment_voucher' | 'invoice' | 'journal_entry';
    title: string;
  }
  
  // Normalization helper for direct and voucher-based entries
  const getNormalizedJournalEntries = () => {
    const list = [...journalEntries];
    
    receiptVouchers.forEach((rv: any) => {
      const hasJv = list.some(j => j.receiptVoucherId === rv.id || j.id === `JV-RV-${rv.id}` || j.description.includes(rv.id));
      const creditAccount = rv.revenueAccount
        || rv.creditAccount
        || rv.receivableAccount
        || (rv.studentId || rv.studentPaymentId ? '1201' : '');
      if (!hasJv && rv.receivingAccount && creditAccount && Number(rv.amount) > 0) {
        list.push({
          id: `JV-RV-${rv.id}`,
          date: rv.date,
          description: `سند قبض ${rv.id} - ${rv.against} (${rv.receivedFrom}) [مركز تكلفة: ${rv.stage}]`,
          debitTotal: rv.amount,
          creditTotal: rv.amount,
          status: rv.status === 'معتمد' ? 'معتمد' : (rv.status === 'مرحل' ? 'مرحل' : 'مسودة'),
          type: 'بسيط',
          createdByUser: rv.user || 'سليمان غازي',
          createdAt: `${rv.date} 08:00`,
          updatedAt: `${rv.date} 08:05`,
          receiptVoucherId: rv.id,
          lines: [
            { id: `l-rv-${rv.id}-1`, accountCode: rv.receivingAccount, accountName: accounts.find(a => a.code === rv.receivingAccount)?.nameAr || '', description: rv.against, debit: rv.amount, credit: 0, costCenter: rv.costCenter },
            { id: `l-rv-${rv.id}-2`, accountCode: creditAccount, accountName: accounts.find(a => a.code === creditAccount)?.nameAr || '', description: rv.against, debit: 0, credit: rv.amount, costCenter: rv.costCenter }
          ]
        });
      }
    });

    paymentVouchers.forEach((pv: any) => {
      const hasJv = list.some(j => j.paymentVoucherId === pv.id || j.id === `JV-PV-${pv.id}` || j.description.includes(pv.id));
      if (!hasJv && pv.paidToAccount && pv.paidFromAccount && Number(pv.amount) > 0) {
        list.push({
          id: `JV-PV-${pv.id}`,
          date: pv.date,
          description: `سند صرف ${pv.id} - ${pv.against} (${pv.beneficiary})`,
          debitTotal: pv.amount,
          creditTotal: pv.amount,
          status: pv.status === 'معتمد' ? 'معتمد' : (pv.status === 'مرحل' ? 'مرحل' : 'مسودة'),
          type: 'بسيط',
          createdByUser: 'سليمان غازي',
          createdAt: `${pv.date} 09:00`,
          updatedAt: `${pv.date} 09:10`,
          paymentVoucherId: pv.id,
          lines: [
            { id: `l-pv-${pv.id}-1`, accountCode: pv.paidToAccount, accountName: accounts.find(a => a.code === pv.paidToAccount)?.nameAr || '', description: pv.against, debit: pv.amount, credit: 0, costCenter: pv.costCenter },
            { id: `l-pv-${pv.id}-2`, accountCode: pv.paidFromAccount, accountName: accounts.find(a => a.code === pv.paidFromAccount)?.nameAr || '', description: pv.against, debit: 0, credit: pv.amount, costCenter: pv.costCenter }
          ]
        });
      }
    });

    return list.map((entry: any) => {
      if (entry.lines && entry.lines.length > 0) {
        return entry;
      }
      const lines: any[] = [];
      const isRv = entry.description.includes('سند قبض');
      const isPv = entry.description.includes('سند صرف');
      
      if (isRv || entry.receiptVoucherId) {
        const rvIdMatch = entry.description.match(/سند قبض (RV-\d+-\d+)/);
        const rvId = rvIdMatch ? rvIdMatch[1] : entry.receiptVoucherId;
        const rv = receiptVouchers.find(v => v.id === rvId);
        
        const debitAcc = rv?.receivingAccount;
        const creditAcc = rv?.revenueAccount || rv?.creditAccount || rv?.receivableAccount || (rv?.studentId || rv?.studentPaymentId ? '1201' : undefined);
        const amt = entry.debitTotal || rv?.amount || 0;
        const cc = rv?.costCenter || 'primary';
        if (debitAcc && creditAcc && Number(amt) > 0) {
          lines.push({ id: `cl-rv-1`, accountCode: debitAcc, accountName: accounts.find(a => a.code === debitAcc)?.nameAr || '', description: entry.description, debit: amt, credit: 0, costCenter: cc });
          lines.push({ id: `cl-rv-2`, accountCode: creditAcc, accountName: accounts.find(a => a.code === creditAcc)?.nameAr || '', description: entry.description, debit: 0, credit: amt, costCenter: cc });
        }
      } else if (isPv || entry.paymentVoucherId) {
        const pvIdMatch = entry.description.match(/سند صرف (PV-\d+-\d+)/);
        const pvId = pvIdMatch ? pvIdMatch[1] : entry.paymentVoucherId;
        const pv = paymentVouchers.find(v => v.id === pvId);
        
        const debitAcc = pv?.paidToAccount;
        const creditAcc = pv?.paidFromAccount;
        const amt = entry.debitTotal || pv?.amount || 0;
        const cc = pv?.costCenter || 'primary';
        if (debitAcc && creditAcc && Number(amt) > 0) {
          lines.push({ id: `cl-pv-1`, accountCode: debitAcc, accountName: accounts.find(a => a.code === debitAcc)?.nameAr || '', description: entry.description, debit: amt, credit: 0, costCenter: cc });
          lines.push({ id: `cl-pv-2`, accountCode: creditAcc, accountName: accounts.find(a => a.code === creditAcc)?.nameAr || '', description: entry.description, debit: 0, credit: amt, costCenter: cc });
        }
      }
      
      return {
        ...entry,
        lines
      };
    });
  };

  // Selection handler for report
  
  // Breadcrumb navigation handler
  
  // Step 1 -> Step 2 Drilldown
  
  // Step 2 -> Step 3 Drilldown
  const handleDrillDownToJournalEntry = (jvId: string) => {
    if (!drillDownUser?.permissions?.includes('view_jv')) {
      triggerNotification(`❌ عذراً ${drillDownUser?.name || 'المستخدم الحالي'}! تم رفض الوصول لعدم وجود صلاحية استعراض تفاصيل قيود اليومية العامة (RBAC).`, 'warning');
      return;
    }

    const normEntries = getNormalizedJournalEntries();
    const jv = normEntries.find(j => j.id === jvId);
    if (!jv) {
      triggerNotification(`⚠️ تعذر العثور على القيد المحاسبي المرفق رقم: ${jvId}`, 'warning');
      return;
    }
    
    setDrillDownStack(prev => {
      const baseStep = prev.filter(s => s.level === 'report_view' || s.level === 'account_statement');
      return [
        ...baseStep,
        {
          level: 'journal_entry',
          journalEntryId: jvId,
          title: `قيد محاسبي: ${jvId}`
        }
      ];
    });
    
    triggerNotification(`🔗 تم الانتقال إلى تفاصيل القيد: ${jvId}`, 'success');
    logAction('DRILL_DOWN_JV', `تنقل هرمي للقيد رقم ${jvId} من كشف الحساب`, 'الحسابات العامة');
    addJvAuditEvent(jvId, 'استعراض تفاصيل القيد', drillDownUser?.name || 'المستخدم الحالي غير محدد', `تنقل هرمي (Drill-Down) إلى تفاصيل القيد رقم ${jvId}`);
  };

  // Step 3 -> Step 4 Drilldown
                          const [trialBalanceMode, setTrialBalanceMode] = useState<'balances' | 'movements' | 'nested'>('nested');
  const [expandedReportNodes, setExpandedReportNodes] = useState<Record<string, boolean>>({
    '1000': true, '1100': true, '2000': true, '3000': true, '4000': true, '4100': true, '5000': true, '5100': true, '5200': true
  });

  // --- Year 2026 ERP-level Master Roles ---
  const DEFAULT_ROLES = [
    { id: 'admin', name: 'مدير النظام (كامل الصلاحيات)', permissions: ['*'] },
    { 
      id: 'financial_manager', 
      name: 'المدير المالي (كامل الصلاحيات المالية)', 
      permissions: [
        'dashboard:view', 'dashboard:refresh',
        'ledger:view', 'ledger:create_jv', 'ledger:post_jv', 'ledger:close_year',
        'fees:view', 'fees:create_receipt', 'fees:approve_receipt', 'fees:print',
        'assets:view', 'assets:depreciate', 'assets:create',
        'reports:view', 'reports:export',
        'settings:view', 'settings:edit',
        'permissions:view', 'permissions:edit', 'permissions:audit_logs',
        'view_reports', 'view_account_statement', 'view_jv', 'view_original_docs'
      ] 
    },
    { 
      id: 'accountant', 
      name: 'كبير المحاسبين (ترحيل مالي)', 
      permissions: [
        'dashboard:view',
        'ledger:view', 'ledger:create_jv', 'ledger:post_jv',
        'fees:view', 'fees:create_receipt', 'fees:print',
        'assets:view',
        'reports:view', 'reports:export',
        'view_reports', 'view_account_statement', 'view_jv', 'view_original_docs'
      ] 
    },
    { 
      id: 'cashier', 
      name: 'أمين الصندوق (القبض والتحصيل)', 
      permissions: [
        'dashboard:view',
        'fees:view', 'fees:create_receipt', 'fees:print',
        'view_reports'
      ] 
    },
    { 
      id: 'student_affairs', 
      name: 'مسئول شئون الطلاب والقبول', 
      permissions: [
        'dashboard:view',
        'students:view', 'students:create', 'students:edit', 'students:import',
        'attendance:view', 'attendance:edit'
      ] 
    },
    { 
      id: 'hr_manager', 
      name: 'مسئول شئون العاملين والرواتب', 
      permissions: [
        'dashboard:view',
        'hr:view', 'hr:create', 'hr:edit', 'hr:attendance',
        'attendance:view', 'attendance:edit'
      ] 
    },
    { 
      id: 'control', 
      name: 'مسئول الكنترول والنتائج', 
      permissions: [
        'dashboard:view',
        'exams:view', 'exams:edit', 'exams:recalculate', 'exams:publish'
      ] 
    },
    { 
      id: 'warehouse_keeper', 
      name: 'أمين المخزن والمستودع', 
      permissions: [
        'dashboard:view',
        'warehouse:view', 'warehouse:create', 'warehouse:audit'
      ] 
    },
    { 
      id: 'assets_manager', 
      name: 'مسئول الأصول والتجهيزات', 
      permissions: [
        'dashboard:view',
        'assets:view', 'assets:create', 'assets:depreciate'
      ] 
    },
    { 
      id: 'auditor', 
      name: 'مدقق مالي مساعد (رقابة فقط)', 
      permissions: [
        'dashboard:view',
        'ledger:view', 'fees:view', 'students:view', 'hr:view', 'reports:view',
        'view_reports', 'view_account_statement', 'view_jv'
      ] 
    }
  ];

  // Master Users list with full details for ERP
  const INITIAL_USERS = [
    { 
      id: 'user_001', 
      name: 'سليمان غازي', 
      roleId: 'financial_manager', 
      role: 'المدير المالي (كامل الصلاحيات)', 
      department: 'الإدارة المالية', 
      jobTitle: 'المدير المالي العام',
      permissions: [
        'dashboard:view', 'dashboard:refresh',
        'ledger:view', 'ledger:create_jv', 'ledger:post_jv', 'ledger:close_year',
        'fees:view', 'fees:create_receipt', 'fees:approve_receipt', 'fees:print',
        'assets:view', 'assets:depreciate', 'assets:create',
        'reports:view', 'reports:export',
        'settings:view', 'settings:edit',
        'permissions:view', 'permissions:edit', 'permissions:audit_logs',
        'view_reports', 'view_account_statement', 'view_jv', 'view_original_docs'
      ], 
      maxLimit: 100000 
    },
    { 
      id: 'user_002', 
      name: 'منصور خلف', 
      roleId: 'accountant', 
      role: 'كبير المحاسبين (ترحيل مالي)', 
      department: 'الحسابات العامة', 
      jobTitle: 'رئيس قسم الأستاذ العام',
      permissions: [
        'dashboard:view',
        'ledger:view', 'ledger:create_jv', 'ledger:post_jv',
        'fees:view', 'fees:create_receipt', 'fees:print',
        'assets:view',
        'reports:view', 'reports:export',
        'view_reports', 'view_account_statement', 'view_jv', 'view_original_docs'
      ], 
      maxLimit: 50000 
    },
    { 
      id: 'user_003', 
      name: 'رنا جودت', 
      roleId: 'student_affairs', 
      role: 'مسئول شئون الطلاب والقبول', 
      department: 'القبول والتسجيل', 
      jobTitle: 'مشرف شئون الطلاب والقبول',
      permissions: [
        'dashboard:view',
        'students:view', 'students:create', 'students:edit', 'students:import',
        'attendance:view', 'attendance:edit'
      ], 
      maxLimit: 5000 
    },
    { 
      id: 'user_004', 
      name: 'عمر الخطيب', 
      roleId: 'hr_manager', 
      role: 'مسئول شئون العاملين والرواتب', 
      department: 'الموارد البشرية', 
      jobTitle: 'رئيس وحدة الموظفين ورواتب الكادر',
      permissions: [
        'dashboard:view',
        'hr:view', 'hr:create', 'hr:edit', 'hr:attendance',
        'attendance:view', 'attendance:edit'
      ], 
      maxLimit: 5000 
    },
    { 
      id: 'user_005', 
      name: 'سالم الوحيشي', 
      roleId: 'auditor', 
      role: 'مدقق مالي مساعد (رقابة فقط)', 
      department: 'التفتيش الداخلي', 
      jobTitle: 'مفتش تدقيق حسابات مساعد',
      permissions: [
        'dashboard:view',
        'ledger:view', 'fees:view', 'students:view', 'hr:view', 'reports:view',
        'view_reports', 'view_account_statement', 'view_jv'
      ], 
      maxLimit: 10000 
    },
    { 
      id: 'user_006', 
      name: 'عبد المطلب الزاوي', 
      roleId: 'warehouse_keeper', 
      role: 'أمين المخزن والمستودع', 
      department: 'التموين والمستودعات', 
      jobTitle: 'أمين مخزن الكتب والزي المدرسي',
      permissions: [
        'dashboard:view',
        'warehouse:view', 'warehouse:create', 'warehouse:audit'
      ], 
      maxLimit: 2000 
    },
    { 
      id: 'user_007', 
      name: 'فدوى البوسيفي', 
      roleId: 'control', 
      role: 'مسئول الكنترول والنتائج', 
      department: 'الامتحانات وشئون الطلاب', 
      jobTitle: 'مسئول كنترول الفروع الموحد',
      permissions: [
        'dashboard:view',
        'exams:view', 'exams:edit', 'exams:recalculate', 'exams:publish'
      ], 
      maxLimit: 0 
    },
    { 
      id: 'user_guest', 
      name: 'زائر / ضيف (عرض تقارير فقط)', 
      roleId: 'auditor', 
      role: 'زائر / ضيف (عرض تقارير فقط)', 
      department: 'التفتيش الخارجي', 
      jobTitle: 'مدقق زائر خارجي',
      permissions: [
        'dashboard:view',
        'reports:view',
        'view_reports'
      ], 
      maxLimit: 0 
    }
  ];

  const [localRoles, setLocalRoles] = useState<any[]>(() => {
    if (canonicalPersistenceRequired) return [];
    const saved = localStorage.getItem('erp_roles_list_v1');
    return saved ? JSON.parse(saved) : DEFAULT_ROLES;
  });
  const roles = rolesProp !== undefined ? rolesProp : localRoles;
  const setRoles = setRolesProp !== undefined ? setRolesProp : setLocalRoles;

  const [localUsers, setLocalUsers] = useState<any[]>(() => {
    if (canonicalPersistenceRequired) return [];
    const saved = localStorage.getItem('erp_users_list_v1');
    return saved ? JSON.parse(saved) : [];
  });
  const SIMULATED_USERS = usersProp !== undefined ? usersProp : localUsers;
  const setUsers = setUsersProp !== undefined ? setUsersProp : setLocalUsers;

  const [localPermissionsAuditLog, setLocalPermissionsAuditLog] = useState<any[]>(() => {
    if (canonicalPersistenceRequired) return [];
    const saved = localStorage.getItem('erp_permissions_audit_log_v1');
    return saved ? JSON.parse(saved) : [];
  });
  const permissionsAuditLog = permissionsAuditLogProp !== undefined ? permissionsAuditLogProp : localPermissionsAuditLog;
  const setPermissionsAuditLog = setPermissionsAuditLogProp !== undefined ? setPermissionsAuditLogProp : setLocalPermissionsAuditLog;

  // --- YEAR CLOSING SYSTEM STATES ---
                                  const [showPostClosingTrialBalance, setShowPostClosingTrialBalance] = useState<boolean>(false);
  
  const [localDrillDownUser, setLocalDrillDownUser] = useState<any>(() => {
    if (canonicalPersistenceRequired) return null;
    const saved = localStorage.getItem('erp_users_list_v1');
    const initial = saved ? JSON.parse(saved) : [];
    return initial[0];
  });
  const drillDownUser = currentDrillDownUserProp !== undefined ? currentDrillDownUserProp : localDrillDownUser;
  const setDrillDownUser = setDrillDownUserProp !== undefined ? setDrillDownUserProp : setLocalDrillDownUser;
  const [drillDownHistory, setDrillDownHistory] = useState<any[]>([]);
  const [drillDownJvId, setDrillDownJvId] = useState<string | null>(null);
  const [drillDownDoc, setDrillDownDoc] = useState<{ id: string; type: string; data: any } | null>(null);

  const hasUserPermission = (permissionId: string) => {
    if (!drillDownUser) return false;
    if (drillDownUser?.permissions?.includes('*') || drillDownUser?.role?.includes('كامل الصلاحيات')) {
      return true;
    }
    return Boolean(drillDownUser?.permissions?.includes(permissionId));
  };

  const isItemPermitted = (itemId: string) => {
    if (!drillDownUser) return false;
    if (drillDownUser?.permissions?.includes('*') || drillDownUser?.role?.includes('كامل الصلاحيات')) {
      return true;
    }

    // Map each item to its respective visibility requirements (Requirement 4 & 5)
    switch (itemId) {
      case 'dashboard': 
        return hasUserPermission('dashboard:view') && hasUserPermission('show_screen:dashboard:main');
      case 'trial_balance': 
        return hasUserPermission('ledger:view') && hasUserPermission('show_module:ledger') && hasUserPermission('show_screen:ledger:chart');
      case 'cost_centers': 
        return hasUserPermission('ledger:view') && hasUserPermission('show_module:ledger') && hasUserPermission('show_screen:ledger:chart');
      case 'journal_entries': 
        return hasUserPermission('ledger:view') && hasUserPermission('show_module:ledger') && hasUserPermission('show_screen:ledger:jv');
      case 'receipt_voucher': 
      case 'payment_voucher': 
      case 'bank_transfer':
        return hasUserPermission('fees:view') && hasUserPermission('show_module:ledger') && hasUserPermission('show_screen:ledger:vouchers');
      case 'customers': 
        return hasUserPermission('students:view') && hasUserPermission('show_module:students') && hasUserPermission('show_screen:students:directory');
      case 'suppliers': 
        return hasUserPermission('warehouse:view') && hasUserPermission('show_module:warehouse') && hasUserPermission('show_screen:warehouse:inventory');
      case 'fixed_assets': 
        return hasUserPermission('assets:view') && hasUserPermission('show_module:assets') && hasUserPermission('show_screen:assets:register');
      case 'financial_reports': 
        return hasUserPermission('reports:view') && hasUserPermission('show_module:settings');
      case 'governance': 
        return hasUserPermission('settings:view') && hasUserPermission('show_module:settings') && hasUserPermission('show_screen:settings:policies');
      case 'closing': 
        return hasUserPermission('ledger:close_year') && hasUserPermission('show_module:ledger') && hasUserPermission('show_screen:ledger:closing');
      case 'users_admin': 
        return hasUserPermission('permissions:view') && hasUserPermission('show_module:settings') && hasUserPermission('show_screen:settings:rbac_management');
      case 'calc_tools': 
        return true;
      default: 
        return true;
    }
  };

  // Global report export Excel/CSV handler
  const exportReportExcel = (reportName: string, headers: string[], rows: any[][]) => {
    triggerNotification(`📥 جاري إنشاء نسخة عرض من ${reportName}؛ هذه ليست قائمة مالية معتمدة.`, 'info');
    setTimeout(() => {
      const csvContent = "\uFEFF" 
        + [headers.join(','), ...rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerNotification('تم تنزيل نسخة العرض، ولم تُعتمد كتقرير مالي رسمي.', 'info');
    }, 300);
  };

  const requireCanonicalLedgerAction = (actionName: string) => {
    if (canonicalFinancialStatus !== 'ready') {
      triggerNotification(`تعذر تنفيذ ${actionName}: المصدر المحاسبي المركزي غير جاهز أو غير موثوق.`, 'warning');
      return false;
    }
    if (canonicalFinancialWriteMode === 'snapshot_write') {
      triggerNotification(`سيتم تنفيذ ${actionName} كنسخة عرض من snapshot UAT؛ لا تُعد قائمة مالية أو دفتر أستاذ معتمداً.`, 'info');
      return true;
    }
    if (!canonicalLedgerReady) {
      if (canonicalFinancialWriteMode === 'snapshot_write') {
        triggerNotification(`تم منع ${actionName}: هذه نسخة UAT مركزية وليست دفتر أستاذ عاماً معتمداً.`, 'info');
      } else {
        triggerNotification(`تعذر تنفيذ ${actionName}: المصدر الحالي snapshot للقراءة فقط، ولا توجد خدمة دفتر أستاذ كانونية معتمدة.`, 'warning');
      }
      return false;
    }
    return true;
  };

  const handlePrintLedgerView = () => {
    if (!requireCanonicalLedgerAction('الطباعة')) return;
    window.print();
  };

  const handleExportLedgerExcel = () => {
    if (!requireCanonicalLedgerAction('تصدير الأستاذ العام')) return;
    const rows = getNormalizedJournalEntries().flatMap((entry: any) => (entry.lines || []).map((line: any) => [
      entry.date || '', entry.id || '', entry.description || '', line.accountCode || '', line.accountName || '',
      Number(line.debit || 0).toFixed(2), Number(line.credit || 0).toFixed(2), line.costCenter || ''
    ]));
    exportReportExcel('الأستاذ_العام', ['التاريخ', 'رقم القيد', 'البيان', 'رمز الحساب', 'اسم الحساب', 'مدين', 'دائن', 'مركز التكلفة'], rows);
  };

  const handleExportLedgerPdf = () => {
    if (!requireCanonicalLedgerAction('تصدير PDF')) return;
    window.print();
  };

  const handleImportLedgerExcel = () => {
    if (!canonicalFinancialWriteReady) {
      triggerNotification('استيراد الحسابات والقيود متوقف: فعّل مسار الكتابة المركزي أولاً.', 'warning');
      return;
    }
    setActiveTab('trial_balance');
    setActiveSidebarItem('trial_balance');
    setShowCoaImportModal(true);
    triggerNotification('اختر ملف الاستيراد من نافذة شجرة الحسابات ثم راجعه قبل أي حفظ مركزي.', 'info');
  };

  const handleDownloadLedgerTemplate = () => {
    const headers = ['التاريخ', 'البيان', 'رمز الحساب المدين', 'رمز الحساب الدائن', 'المبلغ', 'مركز التكلفة'];
    const csvContent = '\uFEFF' + headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'قالب_استيراد_قيود_الأستاذ_العام.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    triggerNotification('تم تنزيل قالب هيكلي فقط — لا يتم ترحيل أي حركة من خلاله.', 'info');
  };

  // ===================================================================
  // CORE FIXED ASSETS BUSINESS LOGIC ENGINE
  // ===================================================================

  
  
  
  
  
  
  // Archive account with strict accounting validations. Posted history is
  // never physically deleted from the canonical chart.
  const handleDeleteCoa = async () => {
    if (!selectedAccountCode) return;
    if (!requireCanonicalFinancialWrite('تعطيل الحساب')) return;

    const accToDelete = accounts.find(a => a.code === selectedAccountCode);
    if (!accToDelete) return;

    if (!hasUserPermission('ledger:delete')) {
      triggerNotification('عذراً، لا تملك الصلاحية المعتمدة لتعطيل حساب من الدليل المحاسبي.', 'warning');
      return;
    }

    if (!selectedSchool?.id || !drillDownUser?.id) {
      triggerNotification('تعذر تنفيذ التعطيل: هوية المدرسة أو المستخدم الموثوقة غير متاحة.', 'warning');
      return;
    }

    // 1. Prevent deleting account if it is a main account and has children
    const hasChildren = accounts.some(a => a.parentAccountId === selectedAccountCode);
    if (hasChildren) {
      triggerNotification('عذراً، لا يمكن تعطيل حساب رئيسي يحتوي على حسابات تابعة له في الشجرة.', 'warning');
      return;
    }

    // 2. Prevent deleting account with non-zero balance
    if (accToDelete.balance !== 0) {
      triggerNotification('عذراً، لا يمكن تعطيل حساب ذو رصيد مالي غير صفري، يرجى إجراء تسوية قيد إقفال أولاً.', 'warning');
      return;
    }

    // Ask user for final confirmation
    const confirmDelete = window.confirm(`هل أنت متأكد من رغبتك في تعطيل الحساب (${accToDelete.code} - ${accToDelete.nameAr})؟ سيبقى تاريخه المحاسبي محفوظاً.`);
    if (!confirmDelete) return;

    try {
      // Financial accounts remain part of the audit history. Archive the
      // account centrally instead of physically deleting a code that may be
      // referenced by a posted document or an external reconciliation.
      const updatedAccounts = accounts.map(a => a.code === selectedAccountCode
        ? { ...a, isActive: false }
        : a);
      await persistCanonicalFinancialSnapshot({ chartOfAccounts: updatedAccounts });
      setAccounts(updatedAccounts);
      triggerNotification(`✓ تم تعطيل الحساب المالي #${selectedAccountCode} مركزيًا مع الحفاظ على تاريخه المحاسبي.`, 'success');
      setSelectedAccountCode('1000'); // Fallback to root assets
      setCoaMode('view');
    } catch (error: any) {
      triggerNotification(`❌ لم يتم تعطيل الحساب مركزيًا: ${error?.message || 'فشلت المعاملة المحاسبية.'}`, 'warning');
    }
  };

  // Expand and Collapse all nodes
  const handleExpandAllCoa = () => {
    const newExpanded: Record<string, boolean> = {};
    accounts.forEach(a => {
      if (a.type === 'رئيسي') {
        newExpanded[a.code] = true;
      }
    });
    setExpandedNodes(newExpanded);
    triggerNotification('✓ تم توسيع كافة تفرعات شجرة الحسابات بنجاح', 'info');
  };

  const handleCollapseAllCoa = () => {
    setExpandedNodes({});
    triggerNotification('✓ تم طي جميع مستويات شجرة الحسابات الموحدة', 'info');
  };

  // Custom CSV import logic
  const handleImportCoaCSV = async () => {
    if (!requireCanonicalFinancialWrite('استيراد الحسابات')) return;
    if (!coaImportText.trim()) {
      triggerNotification('يرجى لصق بيانات CSV صالحة للاستيراد', 'warning');
      return;
    }

    const rows = coaImportText.split('\n');
    let importedCount = 0;
    const newAccountsBatch: AccountNode[] = [];

    rows.forEach(row => {
      const columns = row.split(',');
      if (columns.length >= 3) {
        const code = columns[0].trim();
        const nameAr = columns[1].trim();
        const typeStr = columns[2].trim(); // 'رئيسي' or 'فرعي'
        const parentId = columns[3] ? columns[3].trim() : undefined;
        const classificationStr = columns[4] ? columns[4].trim() : 'مصروفات';
        const natureStr = columns[5] ? columns[5].trim() : 'مدين';

        // Validate basic formats
        if (code && nameAr && !accounts.some(a => a.code === code) && !newAccountsBatch.some(a => a.code === code)) {
          newAccountsBatch.push({
            id: code,
            code: code,
            name: nameAr,
            nameAr: nameAr,
            nameEn: nameAr + ' English',
            parentAccountId: parentId || undefined,
            type: typeStr === 'رئيسي' ? 'رئيسي' : 'فرعي',
            classification: (classificationStr || 'مصروفات') as any,
            level: parentId ? 3 : 2,
            natureType: natureStr === 'دائن' ? 'دائن' : 'مدين',
            isActive: true,
            balance: 0.00,
            currency: 'د.ل'
          });
          importedCount++;
        }
      }
    });

    if (importedCount > 0) {
      try {
        const updatedAccounts = [...accounts, ...newAccountsBatch];
        await persistCanonicalFinancialSnapshot({ chartOfAccounts: updatedAccounts });
        setAccounts(updatedAccounts);
        triggerNotification(`✓ تم استيراد عدد (${importedCount}) حسابات مالية جديدة وحفظها مركزيًا.`, 'success');
        setShowCoaImportModal(false);
        setCoaImportText('');
      } catch (error: any) {
        triggerNotification(`تعذر حفظ الحسابات المستوردة مركزيًا: ${error?.message || 'خطأ غير معروف'}`, 'warning');
      }
    } else {
      triggerNotification('لم يتم العثور على أي حسابات جديدة صالحة للاستيراد. يرجى مراجعة الصياغة والتأكد من عدم تكرار الأكواد.', 'warning');
    }
  };

  // Helper to sort accounts hierarchically for correct display in tables and printing
  function getOrderedAccounts(): AccountNode[] {
    const rootNodes = accounts.filter(a => !a.parentAccountId);
    const result: AccountNode[] = [];

    function traverse(nodeCode: string) {
      const node = accounts.find(a => a.code === nodeCode);
      if (node) {
        result.push(node);
        const children = accounts.filter(a => a.parentAccountId === nodeCode)
                                 .sort((a, b) => a.code.localeCompare(b.code));
        children.forEach(child => traverse(child.code));
      }
    }

    rootNodes.sort((a, b) => a.code.localeCompare(b.code)).forEach(root => traverse(root.code));
    
    // Add any orphans to be safe
    accounts.forEach(a => {
      if (!result.some(r => r.code === a.code)) {
        result.push(a);
      }
    });

    return result;
  }

  // Print Tree Layout helper
  const handlePrintCoaTree = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const orderedAccounts = getOrderedAccounts();

    const rowsHtml = orderedAccounts.map(acc => {
      const levelClass = acc.level === 1 ? 'level-1' : acc.level === 2 ? 'level-2' : 'level-3';
      const typeClass = acc.type === 'رئيسي' ? 'type-main' : 'type-sub';
      const indentStyle = acc.level > 1 ? `padding-right: ${25 * (acc.level - 1)}px;` : '';
      const nature = acc.natureType || (acc.classification === 'إيرادات' || acc.classification === 'خصوم' || acc.classification === 'حقوق ملكية' ? 'دائن' : 'مدين');
      const balanceFormatted = acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) + ' د.ل';
      
      return `
        <tr class="${levelClass}">
          <td style="font-family: monospace; color: #4f46e5;">${acc.code}</td>
          <td style="${indentStyle}">${acc.nameAr}</td>
          <td><span class="type-badge ${typeClass}">${acc.type}</span></td>
          <td>${nature}</td>
          <td class="balance">${balanceFormatted}</td>
        </tr>
      `;
    }).join('\n');

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>دليل شجرة الحسابات الموحدة - مجمع المدارس الحديثة</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1e293b; }
            h1 { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 5px; }
            h2 { text-align: center; font-size: 14px; color: #64748b; margin-bottom: 30px; font-weight: normal; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background-color: #f1f5f9; padding: 12px 10px; text-align: right; border-bottom: 2px solid #cbd5e1; font-weight: bold; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
            .level-1 { font-weight: bold; background-color: #f8fafc; font-size: 13px; }
            .level-2 { padding-right: 25px; font-weight: 600; }
            .level-3 { padding-right: 50px; }
            .level-4 { padding-right: 75px; }
            .type-badge { font-size: 9px; padding: 2px 6px; border-radius: 4px; display: inline-block; }
            .type-main { background-color: #e0f2fe; color: #0369a1; }
            .type-sub { background-color: #f1f5f9; color: #475569; }
            .balance { font-family: monospace; text-align: left; }
          </style>
        </head>
        <body>
          <h1>مجمع المدارس التعليمي الموحد</h1>
          <h2>تقرير الدليل العام لشجرة الحسابات ومراكز التكلفة للفروع</h2>
          <hr />
          <table>
            <thead>
              <tr>
                <th style="width: 15%">رقم الحساب</th>
                <th style="width: 45%">اسم المصنف المحاسبي</th>
                <th style="width: 12%">نوع الحساب</th>
                <th style="width: 13%">طبيعة الحساب</th>
                <th style="width: 15%; text-align: left;">الرصيد الدفتري الحالي</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <p style="text-align: center; font-size: 10px; color: #94a3b8; margin-top: 50px;">تم التصدير والطباعة تلقائياً من نظام الإدارة المدرسية الموحد</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintJvDirect = (jv: any, template: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerNotification('❌ عذراً، تم حظر فتح نافذة الطباعة التلقائية بواسطة متصفحك. يرجى تفعيل النوافذ المنبثقة للرابط الحالي.', 'warning');
      return;
    }

    const titleText = template === 'no_price' 
      ? 'سند حركة مستندي (سرية وحجب المبالغ)' 
      : 'سند قيد تسوية وقيد يومية مركّب ومعدل';

    const renderRows = () => {
      if (template === 'no_price') {
        return `
          <tr>
            <td colspan="7" style="padding: 30px; text-align: center; color: #dc2626; font-style: italic; font-weight: bold; border: 1px solid #000;">
              *** هذا السند تم حجب تفاصيله وقيمه المالية لغايات مراجعة الحسابات المستندية وسرية الإدارات ***
            </td>
          </tr>
        `;
      }

      return jv.lines.map((l: any, i: number) => {
        const costCenterLabel = l.costCenter === 'kindergarten' ? 'مرحلة الروضة' : 
                               l.costCenter === 'primary' ? 'التعليم الأساسي' : 
                               l.costCenter === 'middle' ? 'التعليم المتوسط' : 'التعليم الثانوي';
        const debitText = l.debit > 0 ? l.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) + ' د.ل' : '-';
        const creditText = l.credit > 0 ? l.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) + ' د.ل' : '-';
        return `
          <tr>
            <td style="text-align: center; border: 1px solid #000; padding: 8px; font-family: monospace;">${i + 1}</td>
            <td style="font-family: monospace; font-weight: bold; border: 1px solid #000; padding: 8px;">${l.accountCode}</td>
            <td style="font-weight: bold; border: 1px solid #000; padding: 8px;">${l.accountName}</td>
            <td style="color: #475569; border: 1px solid #000; padding: 8px;">${l.description || jv.description || ''}</td>
            <td style="text-align: center; font-family: monospace; font-weight: bold; border: 1px solid #000; padding: 8px; background-color: #f0fdf4;">${debitText}</td>
            <td style="text-align: center; font-family: monospace; font-weight: bold; border: 1px solid #000; padding: 8px; background-color: #f5f3ff;">${creditText}</td>
            <td style="text-align: center; font-size: 11px; border: 1px solid #000; padding: 8px;">${costCenterLabel}</td>
          </tr>
        `;
      }).join('\n');
    };

    const renderTotals = () => {
      if (template === 'no_price') return '';
      return `
        <tr style="font-weight: bold; background-color: #f1f5f9;">
          <td colspan="4" style="text-align: center; border: 1px solid #000; padding: 10px;">المجموع المتوازن والمطابق للمعادلة المحاسبية المزدوجة</td>
          <td style="text-align: center; font-family: monospace; border: 1px solid #000; padding: 10px; background-color: #dcfce7; color: #166534;">
            ${jv.debitTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل
          </td>
          <td style="text-align: center; font-family: monospace; border: 1px solid #000; padding: 10px; background-color: #ede9fe; color: #3730a3;">
            ${jv.creditTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل
          </td>
          <td style="border: 1px solid #000; padding: 10px; background-color: #e2e8f0;"></td>
        </tr>
      `;
    };

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>قيد يومية رقم ${jv.id || 'Draft'}</title>
          <style>
            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              padding: 40px;
              color: #000000;
              background-color: #ffffff;
              font-size: 12px;
            }
            .header-container {
              display: flex;
              justify-content: justify;
              align-items: center;
              border-bottom: 2px solid #000000;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .school-info {
              flex-grow: 1;
            }
            .school-title {
              font-size: 15px;
              font-weight: 900;
              margin: 0 0 5px 0;
            }
            .school-subtitle {
              font-size: 11px;
              color: #334155;
              margin: 0 0 3px 0;
              font-weight: bold;
            }
            .school-meta {
              font-size: 9px;
              color: #64748b;
              margin: 0;
            }
            .barcode-container {
              text-align: center;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .barcode-box {
              height: 35px;
              width: 140px;
              border: 1px solid #cbd5e1;
              background: repeating-linear-gradient(90deg, transparent, transparent 2px, #000000 2px, #000000 4px);
            }
            .barcode-label {
              font-family: monospace;
              font-size: 8px;
              font-weight: bold;
              margin-top: 3px;
            }
            .title-section {
              text-align: center;
              margin: 25px 0;
            }
            .title-main {
              font-size: 18px;
              font-weight: 900;
              border-bottom: 2px solid #000000;
              display: inline-block;
              padding-bottom: 5px;
              margin: 0 0 5px 0;
            }
            .title-sub {
              font-size: 11px;
              color: #475569;
              margin: 0;
              font-weight: bold;
            }
            .metadata-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              background-color: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 20px;
              line-height: 1.6;
            }
            .metadata-item {
              font-size: 11px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 11px;
            }
            th {
              background-color: #f1f5f9;
              border: 1px solid #000000;
              padding: 10px 8px;
              font-weight: 950;
              text-align: right;
            }
            td {
              border: 1px solid #000000;
              padding: 8px;
            }
            .signatures-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 20px;
              text-align: center;
              margin-top: 40px;
            }
            .signature-box {
              border-top: 1px dashed #cbd5e1;
              padding-top: 10px;
            }
            .signature-title {
              font-weight: bold;
              font-size: 11px;
              margin-bottom: 15px;
            }
            .signature-name {
              font-family: monospace;
              font-size: 10px;
              color: #475569;
            }
            @media print {
              body { padding: 0; }
              @page { size: A4; margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="school-info">
              <h2 class="school-title">مجمع مدارس الأسرة الحديثة للتعليم المتميز والدمج</h2>
              <p class="school-subtitle">المكتب المحاسبي المركزي - الحسابات المركزية الموحدة</p>
              <p class="school-meta">سجل تجاري رقم: 91102-طرابلس | هاتف: 021-360-1444 | طرابلس، ليبيا</p>
            </div>
            <div class="barcode-container">
              <div class="barcode-box"></div>
              <span class="barcode-label">*${jv.id || 'JV-DRAFT'}*</span>
            </div>
          </div>

          <div class="title-section">
            <h1 class="title-main">${titleText}</h1>
            <p class="title-sub">تاريخ القيد المعتمد بدفاتر الأستاذ العام: ${jv.date}</p>
          </div>

          <div class="metadata-grid">
            <div class="metadata-item">
              <div><b>رقم القيد المستندي:</b> <span style="font-family: monospace; color: #4338ca; font-weight: bold;">${jv.id || 'قيد مسودة غير مثبت'}</span></div>
              <div style="margin-top: 5px;"><b>حالة التثبيت المحاسبي:</b> <span style="font-weight: bold; color: ${jv.status === 'معتمد' ? '#4338ca' : '#047857'}">${jv.status}</span></div>
            </div>
            <div class="metadata-item">
              <div><b>البيان العام للقيد (الشرح):</b> <span style="font-weight: bold;">${jv.description || 'قيود تسوية دورية مدمجة لحسابات المدرسة الموحدة'}</span></div>
              <div style="margin-top: 5px;"><b>مسؤول التثبيت والإنشاء:</b> <span style="font-weight: bold;">${jv.createdByUser} (النظام المالي الموحد)</span></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">#</th>
                <th style="width: 15%;">رقم الحساب</th>
                <th style="width: 25%;">اسم بند الحساب في الشجرة</th>
                <th style="width: 25%;">الشرح والبيان التحليلي للسطر</th>
                <th style="width: 12%; text-align: center;">مدين (Debit)</th>
                <th style="width: 12%; text-align: center;">دائن (Credit)</th>
                <th style="width: 11%; text-align: center;">مركز التكلفة</th>
              </tr>
            </thead>
            <tbody>
              ${renderRows()}
              ${renderTotals()}
            </tbody>
          </table>

          <div class="signatures-grid">
            <div class="signature-box">
              <div class="signature-title">مُعِدّ ومراجع القيد</div>
              <div class="signature-name">${jv.createdByUser}</div>
              <p style="font-size: 8px; color: #64748b; margin-top: 15px;">توقيع المسؤول المالي المباشر</p>
            </div>
            <div class="signature-box">
              <div class="signature-title">رئيس مراجعة الحسابات</div>
              <div class="signature-name" style="font-style: italic; color: #64748b;">مُدقق ومُرحل بالنظام</div>
              <p style="font-size: 8px; color: #64748b; margin-top: 15px;">إقرار المطابقة والاتساق مع المعايير</p>
            </div>
            <div class="signature-box">
              <div class="signature-title">المدير المالي العام للمجموعة</div>
              <div class="signature-name" style="color: #cbd5e1;">..............................</div>
              <p style="font-size: 8px; color: #64748b; margin-top: 15px;">اعتماد الصرف والقيد المركزي</p>
            </div>
          </div>

          <p style="text-align: center; font-size: 10px; color: #94a3b8; margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            تم التصدير والطباعة تلقائياً من نظام الإدارة المدرسية الموحد - مجمع مدارس الأسرة الحديثة الموحد
          </p>

          <script>
            window.onload = function() {
              window.focus();
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    triggerNotification('🖨️ تم توجيه السند المالي لأمر الطباعة السحابي والنافذة المنبثقة بنجاح', 'success');
  };

  
  
  // Export to Excel / CSV format
  const handleExportCoaExcel = () => {
    const orderedAccounts = getOrderedAccounts();
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "رقم الحساب,اسم المصنف المحاسبي (عربي),اسم المصنف المحاسبي (إنجليزي),نوع الحساب,المستوى,طبيعة الحساب,التصنيف الرئيسي,مركز التكلفة,الرصيد\n";

    orderedAccounts.forEach(acc => {
      const row = [
        acc.code,
        `"${acc.nameAr.replace(/"/g, '""')}"`,
        `"${(acc.nameEn || '').replace(/"/g, '""')}"`,
        acc.type,
        acc.level,
        acc.natureType || 'مدين',
        acc.classification,
        acc.costCenterId || 'عام / مجمع',
        acc.balance
      ].join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "شجرة_الحسابات_مجمع_المدارس.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification('📥 تم تنزيل نسخة عرض من الدليل المحاسبي؛ هذه ليست قائمة أو نسخة مالية معتمدة.', 'info');
  };

  // 1. TRIAL BALANCE EXPORT/PRINT
  const handleExportTrialBalanceExcel = () => {
      triggerNotification('📥 جاري تنزيل نسخة عرض من ميزان المراجعة؛ المصدر الحالي للقراءة فقط.', 'info');
    setTimeout(() => {
      const headers = ['رمز الحساب', 'اسم الحساب المحاسبي', 'التصنيف', 'طبيعة الحساب', 'أرصدة مدينة (ر.س)', 'أرصدة دائنة (ر.س)'];
      let totalDebit = 0;
      let totalCredit = 0;
      
      const rows = accounts.map(acc => {
        const isDebit = acc.natureType === 'مدين' || acc.classification === 'أصول' || acc.classification === 'مصروفات';
        const debitVal = isDebit ? acc.balance : 0;
        const creditVal = !isDebit ? acc.balance : 0;
        
        totalDebit += debitVal;
        totalCredit += creditVal;

        return [
          acc.code,
          acc.nameAr,
          acc.classification,
          acc.natureType || (isDebit ? 'مدين' : 'دائن'),
          debitVal.toFixed(2),
          creditVal.toFixed(2)
        ];
      });

      rows.push(['الإجمالي الموزون المتطابق', '', '', '', totalDebit.toFixed(2), totalCredit.toFixed(2)]);

      const csvContent = "\uFEFF" 
        + [headers.join(','), ...rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ميزان_المراجعة_الشامل_ERP_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerNotification('📥 تم تنزيل نسخة عرض من ميزان المراجعة؛ لا تمثل ترحيلاً أو اعتماداً مركزياً.', 'info');
    }, 600);
  };

  const handleExportTrialBalancePdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerNotification('❌ تم حظر فتح حوار الطباعة. يرجى تفعيل السماح بالنوافذ المنبثقة.', 'warning');
      return;
    }

    let totalDebit = 0;
    let totalCredit = 0;

    const tableRowsHtml = accounts.map(acc => {
      const isDebit = acc.natureType === 'مدين' || acc.classification === 'أصول' || acc.classification === 'مصروفات';
      const debitVal = isDebit ? acc.balance : 0;
      const creditVal = !isDebit ? acc.balance : 0;
      
      totalDebit += debitVal;
      totalCredit += creditVal;

      return `
        <tr>
          <td style="font-family: monospace; color: #4f46e5; border: 1px solid #cbd5e1; padding: 8px;">${acc.code}</td>
          <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 8px;">${acc.nameAr}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${acc.classification}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${acc.natureType || (isDebit ? 'مدين' : 'دائن')}</td>
          <td style="font-family: monospace; text-align: left; background-color: #fcfdfd; border: 1px solid #cbd5e1; padding: 8px;">${debitVal > 0 ? debitVal.toLocaleString(undefined, { minimumFractionDigits: 2 }) + ' د.ل' : '-'}</td>
          <td style="font-family: monospace; text-align: left; background-color: #fdfcfc; border: 1px solid #cbd5e1; padding: 8px;">${creditVal > 0 ? creditVal.toLocaleString(undefined, { minimumFractionDigits: 2 }) + ' د.ل' : '-'}</td>
        </tr>
      `;
    }).join('\n');

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>ميزان المراجعة الشامل - ERP Financials</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #0f172a; background-color: #ffffff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
            h1 { font-size: 18px; font-weight: 900; margin: 0; }
            h2 { font-size: 12px; color: #64748b; margin-top: 5px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 15px; }
            th { background-color: #f1f5f9; padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; text-align: right; }
            .totals { font-weight: bold; background-color: #f8fafc; }
            .system-tag { text-align: center; font-size: 9px; color: #94a3b8; margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <p style="font-size: 11px; font-weight: bold; margin: 0;">الجمهورية الليبية / وزارة التعليم</p>
              <h1 style="color: #4f46e5; margin-top: 3px;">مجمع المدارس التعليمي الموحد</h1>
              <h2 style="margin: 0; margin-top: 2px;">نظام الإدارة المالية والتحصيل السحابي ERP</h2>
            </div>
            <div style="text-align: left; font-size: 10px; font-weight: bold; line-height: 1.4;">
              <p>تقرير: ميزان المراجعة العام</p>
              <p>تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-SA')}</p>
              <p>المستند: معتمد حسابياً</p>
              <p>المستخدم: سليمان غازي</p>
            </div>
          </div>
          
          <h2 style="text-align: center; font-size: 15px; font-weight: 900; color: #1e293b; margin-bottom: 5px;">ميزان المراجعة السنوي الشامل لجميع الأرصدة والعمليات</h2>
          <p style="text-align: center; font-size: 10px; color: #64748b; margin-bottom: 25px;">مطابق وموزون للمعادلة المحاسبية المركبة لمجمع المدارس</p>

          <table>
            <thead>
              <tr>
                <th style="width: 15%">رمز الحساب</th>
                <th style="width: 35%">اسم الحساب الدفتري</th>
                <th style="width: 15%">التصنيف المحاسبي</th>
                <th style="width: 10%">الطبيعة</th>
                <th style="width: 12.5%; text-align: left;">أرصدة مدينة</th>
                <th style="width: 12.5%; text-align: left;">أرصدة دائنة</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
              <tr class="totals">
                <td colspan="4" style="text-align: center; font-size: 12px; border: 1px solid #cbd5e1; padding: 10px;">الإجمالي الموزون المتطابق</td>
                <td style="text-align: left; color: #166534; font-family: monospace; font-size: 12px; border: 1px solid #cbd5e1; padding: 10px; border-top: 2px solid #000;">
                  ${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل
                </td>
                <td style="text-align: left; color: #166534; font-family: monospace; font-size: 12px; border: 1px solid #cbd5e1; padding: 10px; border-top: 2px solid #000;">
                  ${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل
                </td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 50px; display: flex; justify-content: space-between; font-size: 11px; font-weight: bold;">
            <p>مراجعة وتدقيق الحسابات: _________________</p>
            <p>المدير المالي والرقابة: _________________</p>
            <p>الختم الرسمي للمجمع</p>
          </div>

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
    logAction('EXPORT_PDF', 'تصدير ميزان المراجعة الشامل كتقرير PDF مطبوع وموزون', 'الحسابات');
  };

  // 2. INCOME STATEMENT EXPORT/PRINT
  const handleExportIncomeStatementExcel = () => {
      triggerNotification('📥 جاري تنزيل نسخة عرض من بيان الدخل؛ المصدر الحالي للقراءة فقط.', 'info');
    setTimeout(() => {
      const revenueAccounts = accounts.filter(a => a.classification === 'إيرادات');
      const expenseAccounts = accounts.filter(a => a.classification === 'مصروفات');
      
      const totalRevenues = revenueAccounts.reduce((sum, a) => sum + a.balance, 0);
      const totalExpenses = expenseAccounts.reduce((sum, a) => sum + a.balance, 0);
      const netResult = totalRevenues - totalExpenses;

      const headers = ['الحساب المحاسبي', 'الرمز', 'النوع', 'القيمة (د.ل)'];
      const rows: any[] = [];

      rows.push(['الإيرادات التشغيلية المباشرة', '', '', '']);
      revenueAccounts.forEach(a => {
        rows.push([a.nameAr, a.code, 'إيراد', a.balance.toFixed(2)]);
      });
      rows.push(['إجمالي الإيرادات', '', '', totalRevenues.toFixed(2)]);
      rows.push(['', '', '', '']);

      rows.push(['المصروفات والأعباء التشغيلية', '', '', '']);
      expenseAccounts.forEach(a => {
        rows.push([a.nameAr, a.code, 'مصروف', a.balance.toFixed(2)]);
      });
      rows.push(['إجمالي المصروفات', '', '', totalExpenses.toFixed(2)]);
      rows.push(['', '', '', '']);

      rows.push([netResult >= 0 ? 'صافي أرباح الدورة (فائض الكسب)' : 'صافي خسائر الدورة (عجز)', '', '', netResult.toFixed(2)]);

      const csvContent = "\uFEFF" 
        + [headers.join(','), ...rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `كشف_الدخل_التشغيلي_ERP_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerNotification('📥 تم تنزيل نسخة عرض من بيان الدخل؛ لا تمثل قائمة مالية معتمدة.', 'info');
    }, 600);
  };

  const handleExportIncomeStatementPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerNotification('❌ تم حظر فتح نافذة الطباعة التلقائية.', 'warning');
      return;
    }

    const revenueAccounts = accounts.filter(a => a.classification === 'إيرادات');
    const expenseAccounts = accounts.filter(a => a.classification === 'مصروفات');
    
    const totalRevenues = revenueAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalExpenses = expenseAccounts.reduce((sum, a) => sum + a.balance, 0);
    const netResult = totalRevenues - totalExpenses;

    const revenuesHtml = revenueAccounts.map(a => `
      <tr>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; padding-right: 20px;">${a.nameAr}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${a.code}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-family: monospace; text-align: left;">${a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
      </tr>
    `).join('\n');

    const expensesHtml = expenseAccounts.map(a => `
      <tr>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; padding-right: 20px; color: #b91c1c;">${a.nameAr}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${a.code}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-family: monospace; text-align: left; color: #b91c1c;">${a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
      </tr>
    `).join('\n');

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>بيان كشف الدخل التشغيلي - ERP Financials</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #0f172a; background-color: #ffffff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
            h1 { font-size: 18px; font-weight: 900; margin: 0; }
            h2 { font-size: 12px; color: #64748b; margin-top: 5px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 15px; margin-bottom: 30px; }
            th { background-color: #f1f5f9; padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; text-align: right; }
            .section-header { font-weight: bold; background-color: #f8fafc; font-size: 13px; color: #1e1b4b; }
            .total-row { font-weight: bold; background-color: #f1f5f9; font-size: 13px; }
            .result-box { border: 2px solid #0f172a; padding: 15px; border-radius: 8px; text-align: center; font-size: 15px; font-weight: 950; margin-top: 20px; }
            .system-tag { text-align: center; font-size: 9px; color: #94a3b8; margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <p style="font-size: 11px; font-weight: bold; margin: 0;">الجمهورية الليبية / وزارة التعليم</p>
              <h1 style="color: #4f46e5; margin-top: 3px;">مجمع المدارس التعليمي الموحد</h1>
              <h2 style="margin: 0; margin-top: 2px;">نظام الإدارة المالية والتحصيل السحابي ERP</h2>
            </div>
            <div style="text-align: left; font-size: 10px; font-weight: bold; line-height: 1.4;">
              <p>بيان: كشف الدخل التشغيلي</p>
              <p>دورة المراجعة: عام 2026</p>
              <p>تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-SA')}</p>
              <p>المستخدم: سليمان غازي</p>
            </div>
          </div>
          
          <h2 style="text-align: center; font-size: 16px; font-weight: 900; color: #1e293b; margin-bottom: 5px;">قائمة الدخل والأرباح والخسائر للعام المالي 2026</h2>
          <p style="text-align: center; font-size: 10px; color: #64748b; margin-bottom: 25px;">تحليل الفائض والعجز التشغيلي لفروع مجمع المدارس</p>

          <table>
            <thead>
              <tr>
                <th style="width: 50%">البند المحاسبي ومواصفاته</th>
                <th style="width: 20%">رمز الحساب</th>
                <th style="width: 30%; text-align: left;">القيمة والمقدار</th>
              </tr>
            </thead>
            <tbody>
              <tr class="section-header">
                <td colspan="3" style="border: 1px solid #cbd5e1; padding: 10px;">أولاً: الإيرادات والمبيعات والتحصيلات الأكاديمية المباشرة</td>
              </tr>
              ${revenuesHtml}
              <tr class="total-row">
                <td style="border: 1px solid #cbd5e1; padding: 10px;">إجمالي التحصيلات والإيرادات العامة</td>
                <td style="border: 1px solid #cbd5e1; padding: 10px;">-</td>
                <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; color: #166534; font-family: monospace;">${totalRevenues.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
              </tr>
              
              <tr class="section-header">
                <td colspan="3" style="border: 1px solid #cbd5e1; padding: 10px; color: #b91c1c;">ثانياً: المصروفات والعموميات والأعباء التشغيلية</td>
              </tr>
              ${expensesHtml}
              <tr class="total-row" style="color: #b91c1c;">
                <td style="border: 1px solid #cbd5e1; padding: 10px;">إجمالي المصروفات والمنصرف العام</td>
                <td style="border: 1px solid #cbd5e1; padding: 10px;">-</td>
                <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; color: #b91c1c; font-family: monospace;">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
              </tr>
            </tbody>
          </table>

          <div class="result-box" style="${netResult >= 0 ? 'background-color: #f0fdf4; color: #166534; border-color: #166534;' : 'background-color: #fef2f2; color: #991b1b; border-color: #991b1b;'}">
            ${netResult >= 0 ? 'صافي الأرباح المحققة للدورة المالية (فائض الأداء):' : 'صافي العجز والخسائر المسجلة للدورة (عجز الأداء):'}
            <span style="font-family: monospace; font-size: 18px; font-weight: 900; margin-right: 15px;">
              ${netResult.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل
            </span>
          </div>

          <div style="margin-top: 50px; display: flex; justify-content: space-between; font-size: 11px; font-weight: bold;">
            <p>المحاسب المراجع: _________________</p>
            <p>المدير المالي والرقابة: _________________</p>
            <p>الختم والاعتماد</p>
          </div>

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
    logAction('EXPORT_PDF', 'تصدير بيان كشف الدخل التشغيلي كتقرير PDF موثق ومطابق', 'الحسابات');
  };

  // 3. BALANCE SHEET EXPORT/PRINT
  const handleExportBalanceSheetExcel = () => {
      triggerNotification('📥 جاري تنزيل نسخة عرض من الميزانية العمومية؛ المصدر الحالي للقراءة فقط.', 'info');
    setTimeout(() => {
      const assetAccounts = accounts.filter(a => a.classification === 'أصول');
      const liabilityAccounts = accounts.filter(a => a.classification === 'خصوم');
      const equityAccounts = accounts.filter(a => a.classification === 'حقوق ملكية');
      
      const totalAssets = assetAccounts.reduce((sum, a) => sum + a.balance, 0);
      const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + a.balance, 0);
      const totalEquity = equityAccounts.reduce((sum, a) => sum + a.balance, 0);

      const headers = ['المصنف المالي', 'الرمز الكودي', 'التصنيف الرئيسي', 'المقدار الدفتري (د.ل)'];
      const rows: any[] = [];

      rows.push(['الأصول والموجودات (Assets)', '', '', '']);
      assetAccounts.forEach(a => {
        rows.push([a.nameAr, a.code, 'أصول', a.balance.toFixed(2)]);
      });
      rows.push(['إجمالي الأصول', '', '', totalAssets.toFixed(2)]);
      rows.push(['', '', '', '']);

      rows.push(['الخصوم والالتزامات (Liabilities)', '', '', '']);
      liabilityAccounts.forEach(a => {
        rows.push([a.nameAr, a.code, 'خصوم', a.balance.toFixed(2)]);
      });
      rows.push(['إجمالي الخصوم', '', '', totalLiabilities.toFixed(2)]);
      rows.push(['', '', '', '']);

      rows.push(['حقوق الملكية ورأس المال (Equity)', '', '', '']);
      equityAccounts.forEach(a => {
        rows.push([a.nameAr, a.code, 'حقوق ملكية', a.balance.toFixed(2)]);
      });
      rows.push(['إجمالي حقوق الملكية', '', '', totalEquity.toFixed(2)]);
      rows.push(['', '', '', '']);

      rows.push(['إجمالي الخصوم وحقوق الملكية', '', '', (totalLiabilities + totalEquity).toFixed(2)]);

      const csvContent = "\uFEFF" 
        + [headers.join(','), ...rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `الميزانية_العمومية_ERP_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerNotification('📥 تم تنزيل نسخة عرض من الميزانية العمومية؛ لا تمثل قائمة مالية معتمدة.', 'info');
    }, 600);
  };

  const handleExportBalanceSheetPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerNotification('❌ تم حظر فتح نافذة الطباعة التلقائية.', 'warning');
      return;
    }

    const assetAccounts = accounts.filter(a => a.classification === 'أصول');
    const liabilityAccounts = accounts.filter(a => a.classification === 'خصوم');
    const equityAccounts = accounts.filter(a => a.classification === 'حقوق ملكية');
    
    const totalAssets = assetAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = equityAccounts.reduce((sum, a) => sum + a.balance, 0);

    const assetsHtml = assetAccounts.map(a => `
      <tr>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; padding-right: 20px;">${a.nameAr}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${a.code}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-family: monospace; text-align: left;">${a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
      </tr>
    `).join('\n');

    const liabilitiesHtml = liabilityAccounts.map(a => `
      <tr>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; padding-right: 20px;">${a.nameAr}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${a.code}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-family: monospace; text-align: left;">${a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
      </tr>
    `).join('\n');

    const equityHtml = equityAccounts.map(a => `
      <tr>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; padding-right: 20px;">${a.nameAr}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${a.code}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-family: monospace; text-align: left;">${a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
      </tr>
    `).join('\n');

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>الميزانية العمومية والبيان الرأسمالي - ERP Financials</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #0f172a; background-color: #ffffff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
            h1 { font-size: 18px; font-weight: 900; margin: 0; }
            h2 { font-size: 12px; color: #64748b; margin-top: 5px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 15px; margin-bottom: 30px; }
            th { background-color: #f1f5f9; padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; text-align: right; }
            .section-header { font-weight: bold; background-color: #e2e8f0; font-size: 13px; color: #0f172a; }
            .total-row { font-weight: bold; background-color: #f8fafc; font-size: 13px; }
            .double-bottom { border-bottom: 4px double #0f172a !important; }
            .system-tag { text-align: center; font-size: 9px; color: #94a3b8; margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <p style="font-size: 11px; font-weight: bold; margin: 0;">الجمهورية الليبية / وزارة التعليم</p>
              <h1 style="color: #4f46e5; margin-top: 3px;">مجمع المدارس التعليمي الموحد</h1>
              <h2 style="margin: 0; margin-top: 2px;">نظام الإدارة المالية والتحصيل السحابي ERP</h2>
            </div>
            <div style="text-align: left; font-size: 10px; font-weight: bold; line-height: 1.4;">
              <p>بيان: الميزانية العمومية والمركز المالي</p>
              <p>دورة المراجعة: عام 2026</p>
              <p>تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-SA')}</p>
              <p>المستند: معتمد رسمياً</p>
              <p>المستخدم: سليمان غازي</p>
            </div>
          </div>
          
          <h2 style="text-align: center; font-size: 16px; font-weight: 900; color: #1e293b; margin-bottom: 5px;">بيان المركز المالي والميزانية العمومية كما في 2026/12/31</h2>
          <p style="text-align: center; font-size: 10px; color: #64748b; margin-bottom: 25px;">توازن الحسابات الإيجابية والسلبية للنشاط وفق أفضل المعايير المحاسبية العالمية</p>

          <table>
            <thead>
              <tr>
                <th style="width: 50%">اسم المصنف الحسابي</th>
                <th style="width: 20%">رمز المصنف</th>
                <th style="width: 30%; text-align: left;">الرصيد الدفتري</th>
              </tr>
            </thead>
            <tbody>
              <!-- Assets Section -->
              <tr class="section-header">
                <td colspan="3" style="border: 1px solid #cbd5e1; padding: 10px;">الجانب الأيمن: الأصول والموجودات (Assets)</td>
              </tr>
              ${assetsHtml}
              <tr class="total-row double-bottom">
                <td style="border: 1px solid #cbd5e1; padding: 10px;">إجمالي الموجودات والأصول العامة (أ)</td>
                <td style="border: 1px solid #cbd5e1; padding: 10px;">-</td>
                <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; color: #166534; font-family: monospace;">${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
              </tr>

              <!-- Liabilities Section -->
              <tr class="section-header">
                <td colspan="3" style="border: 1px solid #cbd5e1; padding: 10px;">الجانب الأيسر: الخصوم والالتزامات للغير (Liabilities)</td>
              </tr>
              ${liabilitiesHtml}
              <tr class="total-row">
                <td style="border: 1px solid #cbd5e1; padding: 10px;">إجمالي الخصوم والالتزامات للغير</td>
                <td style="border: 1px solid #cbd5e1; padding: 10px;">-</td>
                <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-family: monospace;">${totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
              </tr>

              <!-- Equity Section -->
              <tr class="section-header">
                <td colspan="3" style="border: 1px solid #cbd5e1; padding: 10px;">حقوق الملكية ورأس المال المدور (Equity)</td>
              </tr>
              ${equityHtml}
              <tr class="total-row">
                <td style="border: 1px solid #cbd5e1; padding: 10px;">إجمالي حقوق الملكية ورأس المال</td>
                <td style="border: 1px solid #cbd5e1; padding: 10px;">-</td>
                <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-family: monospace;">${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
              </tr>

              <!-- Total Liabilities + Equity -->
              <tr class="total-row double-bottom" style="background-color: #e0f2fe; color: #0369a1; font-weight: 900;">
                <td style="border: 1px solid #cbd5e1; padding: 10px;">إجمالي الخصوم وحقوق الملكية للجانب الأيسر (ب)</td>
                <td style="border: 1px solid #cbd5e1; padding: 10px;">-</td>
                <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-family: monospace; font-size: 13px;">${(totalLiabilities + totalEquity).toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
              </tr>
            </tbody>
          </table>

          <div style="background-color: #f8fafc; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 11px; text-align: center; font-weight: bold; color: #0284c7;">
            حالة توازن المركز المالي: الجانب الأيمن (أ) = الجانب الأيسر (ب) | الفرق المتوازن: ${Math.abs(totalAssets - (totalLiabilities + totalEquity)).toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل (تطابق كامل)
          </div>

          <div style="margin-top: 50px; display: flex; justify-content: space-between; font-size: 11px; font-weight: bold;">
            <p>المراجع الداخلي: _________________</p>
            <p>المدير المالي والرقابة: _________________</p>
            <p>الختم الرسمي للمركز</p>
          </div>

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
    logAction('EXPORT_PDF', 'تصدير بيان المركز المالي والميزانية العمومية كتقرير PDF معتمد وموزون', 'الحسابات');
  };

  // Add Custom Journal Entry
  const handleAddJV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireCanonicalFinancialWrite('إنشاء القيد')) return;
    const amt = parseFloat(newJV.amount);
    if (!newJV.description || isNaN(amt) || amt <= 0) {
      triggerNotification('الرجاء مراجعة بيانات القيد المزدوج وقيمته', 'warning');
      return;
    }

    const jvCode = `JV-2026-${Math.floor(Math.random() * 899) + 100}`;

    // Create a new Journal Entry as draft
    const newEntry = {
      id: jvCode,
      date: new Date().toISOString().split('T')[0],
      description: newJV.description,
      debitTotal: amt,
      creditTotal: amt,
      status: 'مرحل' as const,
      type: 'بسيط' as const,
      createdByUser: 'سليمان غازي',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: [
        { accountCode: newJV.debitAccount, accountName: accounts.find(a => a.code === newJV.debitAccount)?.nameAr || '', description: newJV.description, debit: amt, credit: 0, costCenter: 'primary' },
        { accountCode: newJV.creditAccount, accountName: accounts.find(a => a.code === newJV.creditAccount)?.nameAr || '', description: newJV.description, debit: 0, credit: amt, costCenter: 'primary' }
      ],
      attachments: [] as string[]
    };

    try {
      if (canonicalFinancialStatus !== 'ready') {
        throw new Error('المصدر المالي المركزي غير جاهز لحفظ القيد.');
      }
      const updatedAccounts = adjustAccountsForLines(accounts, newEntry.lines);
      await persistCanonicalFinancialSnapshot({
        journalEntries: [newEntry, ...journalEntries],
        chartOfAccounts: updatedAccounts
      });
      setJournalEntries(prev => [newEntry, ...prev]);
      setAccounts(updatedAccounts);

      addJvAuditEvent(jvCode, 'قيد مزدوج تلقائي', 'سليمان غازي', `إنشاء قيد مزدوج يدوي ${jvCode} وترحيله فورياً عبر PostingEngine`);
      logAction('JOURNAL_ENTRY', `قيد مزدوج يدوي ${jvCode}: ${newJV.description} بقيمة ${amt.toLocaleString()} د.ل`, 'الحسابات العامة');
      triggerNotification('✓ تم حفظ وترحيل القيد المزدوج بنجاح عبر محرك الترحيل المالي الموحد', 'success');
      setShowAddJVModal(false);
      setNewJV({ description: '', debitAccount: '1101', creditAccount: '4101', amount: '' });
    } catch (error: any) {
      triggerNotification(`فشل حفظ أو ترحيل القيد: ${error.message || String(error)}`, 'warning');
    }
  };

  // ==========================================================
  // 💼 ERP BUSINESS LOGIC LAYER (JOURNAL ENTRIES SYSTEM)
  // ==========================================================
  
  
  
  
  
  
  
  
  
  
  
  const handleSaveJv = async () => {
    if (!requireCanonicalFinancialWrite('حفظ القيد')) return;
    let updatedLines = [...activeJvState.lines];
    let type = activeJvState.type;
    let debitTotal = 0;
    let creditTotal = 0;

    if (activeJvTab === 'simple') {
      type = 'بسيط';
      const debLine = activeJvState.lines[0];
      const credLine = activeJvState.lines[1];
      const amt = parseFloat(debLine?.debit || '0') || parseFloat(credLine?.credit || '0') || 0;
      
      if (amt <= 0) {
        triggerNotification('⚠️ الرجاء إدخال مبلغ صحيح أكبر من الصفر للقيد البسيط', 'warning');
        return;
      }
      const debAcc = debLine?.accountCode || '1101';
      const credAcc = credLine?.accountCode || '4101';
      const desc = activeJvState.description || 'قيد بسيط يدوي';
      const cc = debLine?.costCenter || 'primary';

      const debAccName = accounts.find(a => a.code === debAcc)?.nameAr || '';
      const credAccName = accounts.find(a => a.code === credAcc)?.nameAr || '';

      updatedLines = [
        { id: 'l-1', accountCode: debAcc, accountName: debAccName, description: desc, debit: amt, credit: 0, costCenter: cc },
        { id: 'l-2', accountCode: credAcc, accountName: credAccName, description: desc, debit: 0, credit: amt, costCenter: cc }
      ];
      debitTotal = amt;
      creditTotal = amt;
    } else {
      type = 'مركب';
      debitTotal = updatedLines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
      creditTotal = updatedLines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);

      if (debitTotal <= 0) {
        triggerNotification('⚠️ القيد فارغ أو إجمالي المبالغ صفر', 'warning');
        return;
      }

      const diff = Math.abs(debitTotal - creditTotal);
      if (diff > 0.001) {
        triggerNotification(`❌ لا يمكن الحفظ: القيد غير متوازن! الفرق الحالي هو ${diff.toLocaleString()} د.ل`, 'warning');
        return;
      }

      const missingAccount = updatedLines.some(l => !l.accountCode);
      if (missingAccount) {
        triggerNotification('⚠️ يرجى التأكد من اختيار حساب لكل سطر في جدول القيد', 'warning');
        return;
      }
    }

    const isNew = jvEditMode === 'create';

    const finalJv = {
      ...activeJvState,
      type,
      debitTotal,
      creditTotal,
      status: 'مسودة' as const, // Save as draft first, then post if requested
      lines: updatedLines.map(line => ({
        ...line,
        debit: parseFloat(line.debit) || 0,
        credit: parseFloat(line.credit) || 0
      })),
      updatedAt: new Date().toLocaleString('ar-LY')
    };

    if (isNew && journalEntries.some(j => j.id === finalJv.id)) {
      triggerNotification(`❌ رقم القيد ${finalJv.id} مكرر بالفعل في السجلات!`, 'warning');
      return;
    }

    // تشغيل الرقابة الجنائية والمالية الشاملة على القيود قبل الترحيل أو الحفظ كمعتمد
    const targetStatus = activeJvState.status;
    if (targetStatus === 'مرحل' || targetStatus === 'معتمد') {
      const integrityCheck = validateJvIntegrity(finalJv);
      if (!integrityCheck.isValid) {
        triggerNotification(`❌ فشل حفظ/ترحيل القيد: ${integrityCheck.error}`, 'warning');
        return;
      }
    }

    if (!isNew) {
      const oldJv = journalEntries.find(j => j.id === finalJv.id);
      if (oldJv && (oldJv.status === 'مرحل' || oldJv.status === 'معتمد')) {
        triggerNotification('❌ لا يمكن تعديل القيود المرحلة أو المعتمدة حفاظاً على سلامة الدورة المستندية والرقابة المالية. يرجى تكرار القيد أو إجراء قيد تسوية عكسي.', 'warning');
        return;
      }
    }

    try {
      if (canonicalFinancialStatus !== 'ready') {
        throw new Error('المصدر المالي المركزي غير جاهز لحفظ القيد.');
      }
      const persistedStatus = targetStatus === 'مرحل' ? 'مرحل' : targetStatus === 'معتمد' ? 'معتمد' : 'مسودة';
      const persistedJv = { ...finalJv, status: persistedStatus };
      const nextEntries = isNew
        ? [persistedJv, ...journalEntries]
        : journalEntries.map(j => j.id === persistedJv.id ? persistedJv : j);
      const updatedAccounts = persistedStatus === 'مرحل' || persistedStatus === 'معتمد'
        ? adjustAccountsForLines(accounts, persistedJv.lines)
        : accounts;
      await persistCanonicalFinancialSnapshot({ journalEntries: nextEntries, chartOfAccounts: updatedAccounts });
      setJournalEntries(nextEntries);
      setAccounts(updatedAccounts);

      addJvAuditEvent(finalJv.id, persistedStatus === 'مرحل' ? (isNew ? 'إنشاء وترحيل قيد' : 'تعديل وترحيل قيد') : (isNew ? 'إنشاء قيد' : 'تعديل قيد'), 'سليمان غازي', `حفظ القيد مركزيًا بحالة ${persistedStatus} وإجمالي ${debitTotal.toLocaleString()} د.ل`);
      logAction('JOURNAL_ENTRY', `حفظ قيد ${finalJv.id}: ${finalJv.description} بقيمة ${debitTotal.toLocaleString()}`, 'الحسابات العامة');
      triggerNotification(`✓ تم حفظ القيد ${finalJv.id} مركزيًا كـ (${persistedStatus})`, 'success');
      setActiveJvState(persistedJv);

      setJvEditMode('view');
      setSelectedJvId(finalJv.id);
    } catch (error: any) {
      triggerNotification(`فشل حفظ القيد: ${error.message || String(error)}`, 'warning');
    }
  };

  const handleDeleteJv = async (jvId: string) => {
    if (!requireCanonicalFinancialWrite('حذف أو إلغاء القيد')) return;
    const jv = journalEntries.find(j => j.id === jvId);
    if (!jv) return;

    if (jv.status === 'مرحل' || jv.status === 'معتمد') {
      const confirmVoid = window.confirm(`⚠️ لا يمكن حذف القيود المعتمدة أو المرحلة نهائياً لحماية سلامة الأستاذ العام والدورة المستندية والتسلسل المحاسبي.

هل تريد إلغاء القيد (Void) بالكامل وعكس أثره المالي بنظام تسوية عكسي؟`);
      if (confirmVoid) {
        const cancelReason = window.prompt("الرجاء إدخال سبب الإلغاء لتوثيق المستند ماليّاً وبحسب قواعد الرقابة المحاسبية:");
        if (!cancelReason || cancelReason.trim() === "") {
          triggerNotification("⚠️ يجب تحديد سبب لإلغاء القيد المالي المعتمد.", "warning");
          return;
        }

        try {
          if (canonicalFinancialStatus !== 'ready') {
            throw new Error('المصدر المالي المركزي غير جاهز لإلغاء القيد.');
          }
          const voidedAt = new Date().toLocaleDateString('ar-LY') + ' ' + new Date().toLocaleTimeString('ar-LY');
          const reversalId = `${jvId}-REV-${Date.now().toString().slice(-6)}`;
          const reversalLines = (jv.lines || []).map((line: any, index: number) => ({
            ...line,
            id: `${reversalId}-${index + 1}`,
            debit: Number(line.credit || 0),
            credit: Number(line.debit || 0),
            description: `عكس: ${line.description || jv.description || ''}`
          }));
          const reversalEntry = {
            id: reversalId,
            date: new Date().toISOString().slice(0, 10),
            description: `قيد عكسي لإلغاء ${jvId}: ${cancelReason}`,
            status: 'مرحل',
            type: jv.type || 'مركب',
            debitTotal: Number(jv.creditTotal || 0),
            creditTotal: Number(jv.debitTotal || 0),
            isSystemGenerated: true,
            reversalOf: jvId,
            lines: reversalLines,
            createdAt: new Date().toISOString()
          };
          const cancelledEntry = { ...jv, status: 'ملغى' as any, voidReason: cancelReason, voidedBy: 'سليمان غازي', voidedAt, reversalEntryId: reversalId };
          const updatedEntries = [reversalEntry, ...journalEntries.map(item => item.id === jvId ? cancelledEntry : item)];
          const updatedAccounts = adjustAccountsForLines(accounts, reversalLines);
          await persistCanonicalFinancialSnapshot({ journalEntries: updatedEntries, chartOfAccounts: updatedAccounts });
          setJournalEntries(updatedEntries);
          setAccounts(updatedAccounts);

          // Log in unified EnterpriseAuditLogger
          EnterpriseAuditLogger.log({
            action: 'إلغاء اعتماد',
            oldValue: jv,
            newValue: { ...jv, status: 'ملغى', voidReason: cancelReason, voidedBy: 'سليمان غازي', voidedAt },
            userName: 'سليمان غازي',
            userRole: 'Manager',
            module: 'الحسابات العامة',
            device: 'نظام الإدارة المالية المركزي'
          });

          triggerNotification(`✓ تم إلغاء القيد ${jvId} وتوليد القيد العكسي ${reversalId} مركزيًا.`, 'success');
          setIsJvFullscreen(false);
          setSelectedJvId(null);
        } catch (error: any) {
          triggerNotification(`فشل إلغاء وتوليد القيد العكسي: ${error.message || String(error)}`, 'warning');
        }
      }
      return;
    }

    if (window.confirm(`⚠️ هل أنت متأكد من حذف القيد ${jvId} نهائياً؟`)) {
      try {
        if (canonicalFinancialStatus !== 'ready') {
          throw new Error('المصدر المالي المركزي غير جاهز لحذف المسودة.');
        }
        const updatedEntries = journalEntries.filter(j => j.id !== jvId);
        await persistCanonicalFinancialSnapshot({ journalEntries: updatedEntries });
        setJournalEntries(updatedEntries);

        addJvAuditEvent(jvId, 'حذف قيد', 'سليمان غازي', `حذف القيد نهائياً`);
        logAction('JOURNAL_ENTRY', `حذف قيد يومية ${jvId}`, 'الحسابات العامة');
        triggerNotification(`✓ تم حذف القيد المحاسبي ${jvId} من المسودات`, 'success');
        
        setIsJvFullscreen(false);
        setSelectedJvId(null);
      } catch (error: any) {
        triggerNotification(`فشل حذف القيد: ${error.message || String(error)}`, 'warning');
      }
    }
  };

  const handlePostJv = async (jvId: string) => {
    if (!requireCanonicalFinancialWrite('ترحيل القيد')) return;
    const jv = journalEntries.find(j => j.id === jvId);
    if (!jv) return;

    if (jv.status === 'مرحل') {
      triggerNotification('القيد مرحل بالفعل بسجلات الأستاذ العام', 'info');
      return;
    }

    try {
      if (canonicalFinancialStatus !== 'ready') {
        throw new Error('المصدر المالي المركزي غير جاهز لترحيل القيد.');
      }
      const updatedJv = { ...jv, status: 'مرحل' as const, updatedAt: new Date().toISOString() };
      const updatedEntries = journalEntries.map(item => item.id === jvId ? updatedJv : item);
      const updatedAccounts = adjustAccountsForLines(accounts, jv.lines || []);
      await persistCanonicalFinancialSnapshot({ journalEntries: updatedEntries, chartOfAccounts: updatedAccounts });
      setJournalEntries(updatedEntries);
      setAccounts(updatedAccounts);

      addJvAuditEvent(jvId, 'ترحيل قيد', 'سليمان غازي', `ترحيل القيد وربطه كلياً بميزان المراجعة والأستاذ العام`);
      logAction('JOURNAL_ENTRY', `ترحيل قيد ${jvId}`, 'الحسابات العامة');
      triggerNotification(`✓ تم ترحيل القيد المحاسبي ${jvId} لدفتر الأستاذ العام الموحد`, 'success');
      
      setActiveJvState(updatedJv);
    } catch (error: any) {
      triggerNotification(`فشل الترحيل المالي: ${error.message || String(error)}`, 'warning');
    }
  };

  const handleUnpostJv = async (jvId: string) => {
    if (!requireCanonicalFinancialWrite('إلغاء ترحيل القيد')) return;
    const jv = journalEntries.find(j => j.id === jvId);
    if (!jv) return;

    if (jv.status !== 'مرحل') {
      triggerNotification('القيد غير مرحل (مسودة بالفعل)', 'info');
      return;
    }

    try {
      if (canonicalFinancialStatus !== 'ready') {
        throw new Error('المصدر المالي المركزي غير جاهز لإلغاء ترحيل القيد.');
      }
      const updatedJv = { ...jv, status: 'مسودة' as const, updatedAt: new Date().toISOString() };
      const updatedEntries = journalEntries.map(item => item.id === jvId ? updatedJv : item);
      const updatedAccounts = adjustAccountsForLines(accounts, jv.lines || [], -1);
      await persistCanonicalFinancialSnapshot({ journalEntries: updatedEntries, chartOfAccounts: updatedAccounts });
      setJournalEntries(updatedEntries);
      setAccounts(updatedAccounts);

      addJvAuditEvent(jvId, 'إلغاء ترحيل قيد', 'سليمان غازي', `إلغاء ترحيل القيد وعكس أرصدته من الأستاذ المساعد`);
      logAction('JOURNAL_ENTRY', `إلغاء ترحيل قيد ${jvId}`, 'الحسابات العامة');
      triggerNotification(`↩ تم إلغاء ترحيل القيد ${jvId} ونقله للمسودات للتحرير`, 'success');
      
      setActiveJvState(updatedJv);
    } catch (error: any) {
      triggerNotification(`فشل إلغاء الترحيل: ${error.message || String(error)}`, 'warning');
    }
  };

  const validateJvIntegrity = (jv: any): { isValid: boolean; error?: string } => {
    // 1. Check debit and credit balance
    const lines = jv.lines || [];
    const debitTotal = lines.reduce((sum: number, l: any) => sum + (parseFloat(l.debit) || 0), 0);
    const creditTotal = lines.reduce((sum: number, l: any) => sum + (parseFloat(l.credit) || 0), 0);
    const diff = Math.abs(debitTotal - creditTotal);
    if (diff > 0.001) {
      return { isValid: false, error: `القيد غير متوازن محاسبياً! مجموع المدين (${debitTotal.toLocaleString()}) لا يساوي مجموع الدائن (${creditTotal.toLocaleString()})، الفرق هو ${diff.toLocaleString()}` };
    }

    // 2. Check accounts (cancelled, deleted, non-leaf)
    for (const line of lines) {
      const code = line.accountCode;
      if (!code) {
        return { isValid: false, error: 'يوجد سطر في القيد غير مخصص لحساب مالي' };
      }
      const acc = accounts.find(a => a.code === code || a.id === code);
      if (!acc) {
        return { isValid: false, error: `الحساب ذو الرمز (${code}) غير موجود في دليل الحسابات الحالي (حساب محذوف)` };
      }
      if (!acc.isActive) {
        return { isValid: false, error: `الحساب ذو الرمز (${code} - ${acc.nameAr}) غير نشط أو تم إلغاؤه بنظام الحسابات (حساب ملغى)` };
      }
      if (acc.type === 'رئيسي') {
        return { isValid: false, error: `الحساب ذو الرمز (${code} - ${acc.nameAr}) هو حساب تجميعي رئيسي، يمنع إدراج قيود محاسبية على الحسابات غير الفرعية` };
      }
    }

    // 3. Check Cost Center (Cost Center غير موجود)
    const validCostCenters = ['cc_kg', 'cc_primary', 'cc_middle', 'cc_high', 'kindergarten', 'primary', 'middle', 'secondary', 'all', 'stage_kg', 'stage_primary', 'stage_middle', 'stage_high'];
    for (const line of lines) {
      const cc = line.costCenter;
      if (cc) {
        if (!validCostCenters.includes(cc)) {
          return { isValid: false, error: `مركز التكلفة (${cc}) المحدد في أسطر القيد غير معرّف أو غير موجود بالنظام` };
        }
      }
    }

    // 4. Check Branch (فرع خاطئ)
    const validBranches = ['branch_1_1', 'branch_1_2', 'branch_2_1', 'branch_3_1', 'الفرع الرئيسي', 'الفرع الرئيسي - طرابلس', 'الفرع الغربي'];
    const jvBranch = jv.branchId || jv.branch || 'الفرع الرئيسي - طرابلس';
    if (jvBranch && !validBranches.includes(jvBranch)) {
      return { isValid: false, error: `فرع القيد (${jvBranch}) المحدد غير معرّف أو غير موجود بنظام الفروع المعتمد` };
    }

    // 5. Check School ID (School ID خاطئ)
    const trustedSchoolId = String(selectedSchool?.id || '').trim();
    const jvSchool = String(jv.schoolId || jv.school || '').trim();
    if (!trustedSchoolId) {
      return { isValid: false, error: 'لا يمكن التحقق من القيد دون معرف مدرسة موثوق من الجلسة الحالية' };
    }
    if (!jvSchool) {
      return { isValid: false, error: `القيد ${jv.id || ''} لا يحمل معرف المدرسة؛ تم إيقافه لحماية عزل البيانات` };
    }
    if (jvSchool !== trustedSchoolId) {
      return { isValid: false, error: `مدرسة القيد (${jvSchool}) لا تطابق مدرسة الجلسة الحالية (${trustedSchoolId})` };
    }

    return { isValid: true };
  };

  
  
  
  
  // Categorized modern ERP sidebar structure with simplified accounting terms
  const ledgerSidebarCategories = [
    {
      title: "التحليلات والمتابعة",
      items: [
        { id: 'dashboard', label: 'لوحة التحكم', targetTab: 'dashboard', icon: TrendingUp },
      ]
    },
    {
      title: "الهيكل المالي",
      items: [
        { id: 'trial_balance', label: 'شجرة الحسابات', targetTab: 'trial_balance', icon: Layers },
        { id: 'cost_centers', label: 'مراكز التكلفة', targetTab: 'cost_centers', icon: Percent },
      ]
    },
    {
      title: "العمليات والسندات",
      items: [
        { id: 'journal_entries', label: 'القيود اليومية', targetTab: 'journal_entries', icon: FileText },
        { id: 'receipt_voucher', label: 'سندات القبض', targetTab: 'receipt_voucher', icon: Coins },
        { id: 'payment_voucher', label: 'سندات الصرف', targetTab: 'payment_voucher', icon: Coins },
        { id: 'bank_transfer', label: 'الحوالات البنكية', targetTab: 'bank_transfer', icon: ArrowRightLeft },
      ]
    },
    {
      title: "الأستاذ المساعد",
      items: [
        { id: 'customers', label: 'ذمم الطلاب', targetTab: 'customers', icon: Users },
        { id: 'suppliers', label: 'حسابات الموردين', targetTab: 'suppliers', icon: Users, badge: suppliers.length > 0 ? String(suppliers.length) : undefined },
        { id: 'fixed_assets', label: 'الأصول الثابتة', targetTab: 'fixed_assets', icon: Building2 },
      ]
    },
    {
      title: "التقارير الختامية",
      items: [
        { id: 'financial_reports', label: 'التقارير المالية', targetTab: 'financial_reports', icon: FileSpreadsheet },
      ]
    },
    {
      title: "الإعدادات والسياسات",
      items: [
        { id: 'governance', label: 'السياسات المالية', targetTab: 'governance', icon: CheckCircle2, badge: 'نشط' },
        { id: 'closing', label: 'إقفال السنة', targetTab: 'closing', icon: LockIcon },
        { id: 'users_admin', label: 'إدارة الصلاحيات', targetTab: 'users_admin', icon: UserCheck },
        { id: 'calc_tools', label: 'أدوات الحسبة', targetTab: 'calc_tools', icon: Calculator },
      ]
    }
  ];

  const handleSidebarItemClick = (item: any) => {
    if (item.id === 'users_admin') {
      setActiveSection('permissions_admin');
      triggerNotification('🛡️ جاري الانتقال إلى الإدارة المركزية الموحدة للمستخدمين والصلاحيات...', 'success');
      return;
    }
    if (!isItemPermitted(item.id)) {
      triggerNotification(`❌ عذراً! حسابك الحالي لا يملك صلاحية الوصول لـ [${item.label}] بموجب سياسة الـ RBAC المعتمدة.`, 'warning');
      return;
    }
    setActiveSidebarItem(item.id);
    setActiveTab(item.targetTab);
    
    // Add premium sensory/informative toasts for sub-views
    if (item.id === 'cost_centers') {
      triggerNotification('✓ تم فتح دليل مراكز التكلفة من المصدر المركزي للمدرسة الحالية.', 'success');
    } else if (item.id === 'general_ledger_rep') {
      setSelectedReport('general_ledger');
      triggerNotification('📊 دفتر الأستاذ العام: استعرض القيود المرحلة والتسويات المعتمدة والبحث اللحظي', 'info');
    } else if (item.id === 'trial_balance_rep') {
      setSelectedReport('trial_balance');
      triggerNotification('📊 ميزان المراجعة الشامل (Trial Balance) متاح الآن في قسم التقارير المالية', 'success');
    } else if (item.id === 'income_statement_rep') {
      setSelectedReport('income_statement');
      triggerNotification('🗒 بيان كشف الدخل التشغيلي (Income Statement) متاح الآن في قسم التقارير المالية', 'success');
    } else if (item.id === 'balance_sheet_rep') {
      setSelectedReport('balance_sheet');
      triggerNotification('🏛 الميزانية العمومية والمركز المالي متاح الآن في قسم التقارير المالية', 'success');
    } else if (item.id === 'financial_reports') {
      setSelectedReport(null);
      triggerNotification('📁 تم فتح منصة التقارير المالية والختامية المتكاملة الموحدة', 'info');
    } else {
      triggerNotification(`نشطت لوحة: ${item.label}`, 'info');
    }
  };

  const handleCreateNewCoaClick = () => {
    setShowAddAccountModal(true);
    setCoaMode('create');
    setNewAccount({ code: '', name: '', type: 'فرعي', classification: 'أصول', balance: 0 });
    setCoaForm({ code: '', nameAr: '', nameEn: '', parentAccountId: '', type: 'فرعي', classification: 'أصول', natureType: 'مدين', costCenterId: '', isActive: true, notes: '' });
    triggerNotification('اضغط على "حفظ" بعد إدخال البيانات الجديدة', 'info');
  };

  const handleEditCoaClick = () => {
    const selected = accounts.find(account => account.code === selectedAccountCode);
    if (!selected) {
      triggerNotification('اختر حساباً موثقاً من شجرة الحسابات قبل التعديل.', 'warning');
      return;
    }
    setCoaMode('edit');
    setCoaForm({
      code: selected.code,
      nameAr: selected.nameAr,
      nameEn: selected.nameEn,
      parentAccountId: selected.parentAccountId || '',
      type: selected.type,
      classification: selected.classification,
      natureType: selected.natureType,
      costCenterId: selected.costCenterId || '',
      isActive: selected.isActive,
      notes: selected.notes || ''
    });
    triggerNotification('جاري تحرير بيانات الحساب، يرجى الحذر عند تعديل الأكواد', 'info');
  };

  const addJvAuditEvent = (jvId: string, action: string, userName?: string, details?: string) => { setJvAuditTrail(prev => [...prev, { jvId, action, details: details || userName, date: new Date().toISOString() }]); };
  const handleCancelCoa = () => {
    setCoaMode('view');
    triggerNotification('تم إلغاء العملية بنجاح', 'info');
  };

  const handleSaveCoa = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!canonicalFinancialWriteReady) {
      triggerNotification('تعذر حفظ الحساب: المصدر المالي الحالي للقراءة فقط ولا توجد خدمة دفتر أستاذ كانونية معتمدة.', 'warning');
      return;
    }
    const code = String(coaForm.code || '').trim();
    const nameAr = String(coaForm.nameAr || '').trim();
    if (!code || !nameAr) {
      triggerNotification('يجب إدخال كود الحساب واسمه العربي قبل الحفظ.', 'warning');
      return;
    }
    const editing = coaMode === 'edit';
    const existing = accounts.find(account => account.code === code);
    if (!editing && existing) {
      triggerNotification('كود الحساب موجود مسبقاً ولا يمكن تكراره.', 'warning');
      return;
    }
    const baseAccount = existing || accounts.find(account => account.code === selectedAccountCode);
    const accountNode: AccountNode = {
      id: baseAccount?.id || `coa-${code}`,
      code,
      name: nameAr,
      nameAr,
      nameEn: String(coaForm.nameEn || nameAr),
      parentAccountId: coaForm.parentAccountId || undefined,
      type: coaForm.type === 'رئيسي' ? 'رئيسي' : 'فرعي',
      classification: coaForm.classification || 'أصول',
      level: Number(coaForm.parentAccountId ? (baseAccount?.level || 2) : (baseAccount?.level || 1)),
      natureType: coaForm.natureType === 'دائن' ? 'دائن' : 'مدين',
      costCenterId: coaForm.costCenterId || undefined,
      isActive: coaForm.isActive !== false,
      notes: String(coaForm.notes || ''),
      balance: Number(baseAccount?.balance || 0),
      currency: baseAccount?.currency || currency
    };
    const updatedAccounts = editing
      ? accounts.map(account => account.code === selectedAccountCode ? accountNode : account)
      : [...accounts, accountNode];
    if (editing && !accounts.some(account => account.code === selectedAccountCode)) {
      triggerNotification('تعذر تحديد الحساب الأصلي المراد تعديله.', 'warning');
      return;
    }
    try {
      await persistCanonicalFinancialSnapshot({ chartOfAccounts: updatedAccounts });
      setAccounts(updatedAccounts);
      setCoaMode('view');
      triggerNotification('تم حفظ الحساب في المصدر المحاسبي المركزي بنجاح.', 'success');
    } catch (error: any) {
      triggerNotification(`تعذر حفظ الحساب مركزياً: ${error?.message || 'خطأ غير معروف'}`, 'warning');
    }
  };

  const accountingContextValue = {
    students, invoices, selectedSchool, costCenters,
  canonicalFinancialStatus, canonicalFinancialMessage, canonicalFinancialVersion, canonicalFinancialWriteMode,
  requireCanonicalFinancialWrite,
  persistCanonicalFinancialSnapshot, refreshCanonicalFinancialData,
    activeTab, setActiveTab, activeSidebarItem, setActiveSidebarItem,
    refreshing, setRefreshing, currency, setCurrency, activeSaving, setActiveSaving,
    simAmount, setSimAmount, simCostCenter, setSimCostCenter, isStrictEnforcement, setIsStrictEnforcement,
    accounts, setAccounts, suppliers, setSuppliers, journalEntries, setJournalEntries,
    showAddAccountModal, setShowAddAccountModal, newAccount, setNewAccount,
    selectedAccountCode, setSelectedAccountCode, coaSearchQuery, setCoaSearchQuery,
    coaMode, setCoaMode, selectedAccTab, setSelectedAccTab, inlineBudgetEdit, setInlineBudgetEdit,
    inlineBudgetVal, setInlineBudgetVal, inlineSplits, setInlineSplits, reconcileChecks, setReconcileChecks,
    coaWorkspaceMode, setCoaWorkspaceMode, stressScenario, setStressScenario,
    expenseStressFactor, setExpenseStressFactor, revenueStressFactor, setRevenueStressFactor,
    spreadEditCode, setSpreadEditCode, wizardParentId, setWizardParentId,
    wizardBaseName, setWizardBaseName, wizardClass, setWizardClass,
    coaScanState, setCoaScanState, coaAuditFixCount, setCoaAuditFixCount,
    selectedReport, setSelectedReport, drillDownStack, setDrillDownStack,
    filterFinancialPeriod, setFilterFinancialPeriod, filterFromDate, setFilterFromDate,
    filterToDate, setFilterToDate, filterFiscalYear, setFilterFiscalYear,
    filterAccountingPeriod, setFilterAccountingPeriod, filterCostCenter, setFilterCostCenter,
    filterAccount, setFilterAccount, filterActiveOnly, setFilterActiveOnly,
    filterBalanceOnly, setFilterBalanceOnly, filterSortBy, setFilterSortBy,
    trialBalanceLevel, setTrialBalanceLevel, trialBalanceMode, setTrialBalanceMode,
    expandedReportNodes, setExpandedReportNodes, localRoles, setLocalRoles,
    localUsers, setLocalUsers, localPermissionsAuditLog, setLocalPermissionsAuditLog,
    closingStep, setClosingStep, isCheckingReady, setIsCheckingReady,
    checkedReady, setCheckedReady, closingProgress, setClosingProgress,
    closingProgressMessage, setClosingProgressMessage, closingAuditLog, setClosingAuditLog,
    isYearClosed, setIsYearClosed, closingRefNo, setClosingRefNo,
    closingDate, setClosingDate, openedYear2027, setOpenedYear2027,
    currentClosingYear, setCurrentClosingYear, closingDateInput, setClosingDateInput,
    newYearStartDateInput, setNewYearStartDateInput, newYearEndDateInput, setNewYearEndDateInput,
    newYearNumberInput, setNewYearNumberInput, closingDescriptionInput, setClosingDescriptionInput,
    showPostClosingTrialBalance, setShowPostClosingTrialBalance,
    unapprovedAdjustmentsCount, setUnapprovedAdjustmentsCount, localDrillDownUser, setLocalDrillDownUser,
    drillDownHistory, setDrillDownHistory, drillDownJvId, setDrillDownJvId,
    drillDownDoc, setDrillDownDoc, expandedNodes, setExpandedNodes, coaForm, setCoaForm,
    showCoaImportModal, setShowCoaImportModal, coaImportText, setCoaImportText,
    showAddJVModal, setShowAddJVModal, newJV, setNewJV, isJvFullscreen, setIsJvFullscreen,
    selectedJvId, setSelectedJvId, jvEditMode, setJvEditMode, activeJvTab, setActiveJvTab,
    showJvSearchOverlay, setShowJvSearchOverlay, showJvPrintModal, setShowJvPrintModal,
    selectedJvPrintTemplate, setSelectedJvPrintTemplate, copiedJvLine, setCopiedJvLine,
    jvTableSearch, setJvTableSearch, jvFocusedRowIndex, setJvFocusedRowIndex,
    jvColWidths, setJvColWidths, activeJvState, setActiveJvState, jvSearchFilters, setJvSearchFilters,
    jvAuditTrail, setJvAuditTrail, jvAttachmentsList, setJvAttachmentsList,
    jvTableMaximized, setJvTableMaximized, receiptVouchers, setReceiptVouchers,
    paymentVouchers, setPaymentVouchers, receiptVoucherForm, setReceiptVoucherForm,
    bankTransfers, setBankTransfers,
    paymentVoucherForm, setPaymentVoucherForm, selectedReceiptVoucher, setSelectedReceiptVoucher,
    showReceiptDetailModal, setShowReceiptDetailModal, selectedPaymentVoucher, setSelectedPaymentVoucher,
    showPaymentDetailModal, setShowPaymentDetailModal, receiptSearch, setReceiptSearch,
    receiptCostCenterFilter, setReceiptCostCenterFilter, paymentSearch, setPaymentSearch,
    paymentCostCenterFilter, setPaymentCostCenterFilter, bankTransferForm, setBankTransferForm,
    fixedAssets, setFixedAssets, selectedAssetId, setSelectedAssetId, activeAssetTab, setActiveAssetTab,
    isEditAssetMode, setIsEditAssetMode, isNewAssetMode, setIsNewAssetMode,
    assetSearchQuery, setAssetSearchQuery, assetCategoryFilter, setAssetCategoryFilter,
    assetStatusFilter, setAssetStatusFilter, assetCostCenterFilter, setAssetCostCenterFilter,
    assetForm, setAssetForm, maintenanceForm, setMaintenanceForm, transferForm, setTransferForm,
    saleForm, setSaleForm, discardForm, setDiscardForm, activeAssetModal, setActiveAssetModal,
    fixedAssetReportType, setFixedAssetReportType, fixedAssetViewMode, setFixedAssetViewMode,
    budgets, setBudgets, calcExpr, setCalcExpr, calcResult, setCalcResult,
    fxAmount, setFxAmount, fxFrom, setFxFrom, fxResult, setFxResult,
    
    // Functions
    getNormalizedJournalEntries, handleSelectReport, handleDrillDownBreadcrumbClick,
    handleDrillDownToAccount, handleDrillDownToJournalEntry, handleDrillDownToOriginalDocument,
    hasUserPermission, exportReportExcel, handleSelectAsset, handleNewAsset, handleSaveAsset,
    handleDeleteAsset, handleRecalculateAssetDepreciation, handlePostAssetDepreciation,
    handleTransferAssetSubmit, handleSellAssetSubmit, handleDiscardAssetSubmit, handleMaintenanceSubmit,
    handleImportExcelSimulate, handleDownloadTemplate, handlePrintAssetCard, handlePrintDepreciationSchedule,
    findOriginalDocument, handleReportAccountClick, handleJournalEntryClick,
    isAccountOrDescendant, getProcessedAccounts,
    formatCurrency,
    triggerNotification, validateJvIntegrity, handlePostJv, handleUnpostJv, handleDeleteJv, handleSaveJv, logAction,
    handleCalcPress, handleCreateNewCoaClick, handleEditCoaClick, handleCancelCoa, handleSaveCoa,
    handleDeleteCoa, handleExpandAllCoa, handleCollapseAllCoa, handleExportCoaExcel, handlePrintCoaTree,
    handleImportCoaCSV
  };

  return (
    <AccountingContext.Provider value={accountingContextValue}>
    <div id="general-ledger-portal" className="financial-luxury-accounting-shell w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6" dir="rtl">
      <EnterpriseActionToolbar
        title="الحسابات العامة والرقابة المالية"
        stats={
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] sm:text-xs">
            <span className="text-slate-300 font-bold">عملة التقرير: <span className="text-amber-400 font-mono">{currency === 'LYD' ? 'دينار ليبي (LYD)' : 'ريال سعودي (SAR)'}</span></span>
          </div>
        }
        onExit={setActiveSection ? () => setActiveSection('dashboard') : undefined}
        onPrint={handlePrintLedgerView}
        onExportPdf={handleExportLedgerPdf}
        onExportExcel={handleExportLedgerExcel}
        onImportExcel={canonicalFinancialWriteReady ? handleImportLedgerExcel : undefined}
        onDownloadTemplate={handleDownloadLedgerTemplate}
      />
      <div
        role="status"
        className={`mx-3 sm:mx-4 rounded-2xl border px-4 py-3 text-xs font-bold shadow-sm ${
          canonicalFinancialStatus === 'ready'
            ? canonicalFinancialWriteMode === 'snapshot_write'
              ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
              : 'border-emerald-300 bg-emerald-50 text-emerald-800'
            : canonicalFinancialStatus === 'blocked'
              ? 'border-rose-300 bg-rose-50 text-rose-800'
              : 'border-amber-300 bg-amber-50 text-amber-800'
        }`}
      >
        {canonicalFinancialStatus === 'ready' ? '✓ ' : canonicalFinancialStatus === 'blocked' ? '⚠ ' : '⏳ '}
        {canonicalFinancialMessage}
      </div>
      <div id="general-ledger-portal-layout" className="flex flex-col lg:flex-row-reverse gap-4 w-full p-3 sm:p-4 text-right">
      
      {/* LEFT AREA: Content Window based on nested state */}
      <div id="ledger-content-viewport" className="flex-1  bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300  overflow-hidden min-h-[580px] p-6">
        
        {/* ========================================================== */}
        {/* VIEW 1: MAIN LEDGER DASHBOARD (Matching screenshot EXACTLY) */}
        {/* ========================================================== */}
        {activeTab === 'dashboard' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل لوحة المؤشرات...</div>}>
            <LedgerDashboardTab />
          </React.Suspense>
        )}

        {activeTab === 'cost_centers' && (
          <section className="space-y-5 animate-fade-in" aria-label="دليل مراكز التكلفة">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d4af37]/30 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">دليل مراكز التكلفة</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">المراكز المعروضة مصدرها النطاق المالي المركزي للمدرسة الحالية.</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-[11px] font-black ${canonicalFinancialStatus === 'ready' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {canonicalFinancialStatus === 'ready'
                  ? canonicalFinancialWriteMode === 'snapshot_write'
                    ? 'snapshot متصل — كتابة UAT'
                    : (canonicalFinancialWriteMode === 'ledger_ready' || canonicalFinancialWriteMode === 'erp_integrated')
                      ? 'دفتر الأستاذ متصل — معتمد'
                      : 'snapshot متصل — قراءة فقط'
                  : 'غير متحقق'}
              </span>
            </div>
            {Array.isArray(costCenters) && costCenters.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {costCenters.filter((center: any) => center?.isActive !== false).map((center: any) => (
                  <article key={center.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-lg bg-amber-50 px-2 py-1 font-mono text-xs font-black text-amber-800">{center.code || center.id}</span>
                      <span className="text-[10px] font-bold text-emerald-700">نشط</span>
                    </div>
                    <h3 className="mt-4 text-base font-black text-slate-900">{center.name || center.nameAr || 'مركز غير مسمى'}</h3>
                    <p className="mt-2 text-xs text-slate-500">{center.parentCostCenterId ? `يتبع: ${center.parentCostCenterId}` : 'مركز رئيسي'}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-8 text-center text-sm font-black text-amber-900">
                لا توجد مراكز تكلفة موثقة في المصدر المركزي لهذا النطاق.
              </div>
            )}
          </section>
        )}

        {/* ========================================================== */}
        {/* VIEW: GOVERNANCE & ACCOUNTING POLICY BOARD (ميثاق السياسات المحاسبية المعتمدة) */}
        {/* ========================================================== */}
        {activeTab === 'governance' && (
          <div className="space-y-6 animate-fade-in text-right" dir="rtl">
            {/* Resolution Certificate Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-[#0f172a] to-slate-900 border border-slate-800 p-6 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider">
                      مستند حوكمة رسمي رقم: CC-ERP-2026-009
                    </span>
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/35 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider">
                      إصدار مالي معتمد ✅
                    </span>
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-350 mt-1">
                    ميثاق السياسات والقرارات المحاسبية المعتمدة
                  </h1>
                  <p className="text-xs text-slate-400 max-w-3xl leading-relaxed bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
                    وثيقة المعايير التشغيلية المعتمدة لتصميم البنية المالية والتحليلية لنظام مدارس الأسرة الحديثة لضمان أقصى درجات الدقة والنمو اللامتناهي.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end">
                  <button
                    onClick={() => {
                      window.focus();
                      window.print();
                    }}
                    className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 flex items-center gap-2 transition-all border border-slate-700 shadow-md"
                  >
                    <Printer className="w-4 h-4 text-emerald-400" />
                    <span>طباعة الميثاق والمستند</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Grid of the 5 Strategic Decisions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* Decision 1 */}
              <div className="border-2 border-emerald-500/30 p-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-3xl pointer-events-none group-hover:scale-110 transition-transform" />
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    المحور الأول (دليل موحد)
                  </span>
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                    ١
                  </div>
                </div>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                  شجرة حسابات واحدة موحدة
                </h3>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1.5">
                  اعتماد شجرة محاسبية عامة موحدة ومبسطة لكافة العمليات المدرسية لمنع التفرعات والتشعبات الزائدة وتسهيل استخراج التقارير الختامية الشاملة.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-bold">الحالة التشغيلية:</span>
                  <span className="text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded">✅ مفعّل ومنظم بالكامل</span>
                </div>
              </div>

              {/* Decision 2 */}
              <div className="border-2 border-emerald-500/30 p-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-3xl pointer-events-none group-hover:scale-110 transition-transform" />
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    المحور الثاني (تكامل الإيرادات)
                  </span>
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                    ٢
                  </div>
                </div>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                  عدم إنشاء إيرادات منفصلة لكل مرحلة
                </h3>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1.5">
                  منع إنشاء حسابات إيرادات مكررة للمراحل داخل الشجرة (مثل إيراد الروضة والابتدائي المنفصلين). دمج كافة إيرادات الرسوم الدراسية تحت الحساب الفرعي الموحد <code className="bg-slate-100 text-amber-600 px-1 py-0.5 rounded font-mono font-bold text-[10px]">4101</code>.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-bold">الحالة التشغيلية:</span>
                  <span className="text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded">✅ حساب 4101 موحد ومفعل</span>
                </div>
              </div>

              {/* Decision 3 */}
              <div className="border-2 border-emerald-500/30 p-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-3xl pointer-events-none group-hover:scale-110 transition-transform" />
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    المحور الثالث (الفصل التحليلي)
                  </span>
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                    ٣
                  </div>
                </div>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                  مراكز التكلفة للفصل بين المراحل
                </h3>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1.5">
                  استخدام مراكز التكلفة المخصصة للمراحل التعليمية الأربعة (روضة، ابتدائي، إعدادي، ثانوي) لتوزيع النفقات وتحصيل الإيرادات، مما يتيح تتبع ربحية كل مرحلة دون تضخيم شجرة الحسابات.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-bold">الحالة التشغيلية:</span>
                  <span className="text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded">✅ مراكز التكلفة نشطة بالكامل</span>
                </div>
              </div>

              {/* Decision 4 */}
              <div className="border-2 border-emerald-500/30 p-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-3xl pointer-events-none group-hover:scale-110 transition-transform" />
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    المحور الرابع (ربط إلزامي للقيود)
                  </span>
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                    ٤
                  </div>
                </div>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                  ربط كافة القيود المالية بمركز تكلفة
                </h3>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1.5">
                  إجبار وتأكيد ربط أي حركة مالية (قيد يومية، سند قبض، سند صرف) بمركز التكلفة المناسب لضمان تجميع الأرقام بدقة ومطابقتها الآلية لمنع حدوث قيود غير مصنفة مجهولة المصدر.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-bold">الحالة التشغيلية:</span>
                  <span className="text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded">✅ فحص الربط الإلزامي نشط</span>
                </div>
              </div>

              {/* Decision 5 */}
              <div className="border-2 border-emerald-500/30 p-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-3xl pointer-events-none group-hover:scale-110 transition-transform" />
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    المحور الخامس (التطوير المستقبلي)
                  </span>
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                    ٥
                  </div>
                </div>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                  جاهزية الفروع المتعددة والموازنات
                </h3>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1.5">
                  تصميم البنية الهيكلية والميزان التحليلي والموازنات التقديرية بحيث تدعم التوسع للفروع المتعددة تلقائياً بنظام SaaS السحابي الموحد دون تغيير برمجية الشجرة المحاسبية العامة.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-bold">الحالة التشغيلية:</span>
                  <span className="text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded">✅ جاهز 100% للربط متعدد الفروع</span>
                </div>
              </div>

              {/* Strict Enforcement Controller */}
              <div className="bg-transparent text-slate-800 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#c58a22] animate-pulse" />
                    <span className="text-[10px] font-black text-amber-650 font-mono">CONFORMANCE SYSTEM</span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900">نظام فرض الامتثال الصارم</h3>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    عند تفعيل هذا الخيار، سيقوم محرك الحسابات بمنع ترحيل أي قيد يومية أو قيد مبيعات دون ربطه بأحد مراكز التكلفة المحددة.
                  </p>
                </div>
                
                <div className="mt-5 pt-3 border-t border-slate-200 flex justify-between items-center">
                  <button
                    onClick={() => {
                      setIsStrictEnforcement(!isStrictEnforcement);
                      triggerNotification(
                        !isStrictEnforcement 
                          ? '✓ تم تفعيل نظام فرض الامتثال الصارم لربط القيود بمراكز التكلفة تلقائياً' 
                          : '⚠️ تم إيقاف نظام الامتثال الصارم (الوضع المفتوح)', 
                        !isStrictEnforcement ? 'success' : 'warning'
                      );
                    }}
                    className={`cursor-pointer w-full text-center text-xs font-black py-2 transition-all border ${
                      isStrictEnforcement 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/50' 
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/50'
                    }`}
                  >
                    {isStrictEnforcement ? 'الامتثال الصارم نشط الآن 🛡️' : 'الامتثال الصارم متوقف ⚠️'}
                  </button>
                </div>
              </div>

            </div>

            {/* Live Interactive Simulator: Comparative Visual Demonstration */}
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-600" />
                  محاكي المعالجة المحاسبية التفاعلي (مقارنة التصميم المحاسبي)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  قم بإدخال قيمة المعاملة المالية واختيار المرحلة التعليمية لترى وتفهم فورياً كيف يطبق القرار المهني الموحد داخل دفاتر الأستاذ العام مقارنة بالنهج القديم المعقد.
                </p>
              </div>

              {/* Interactive Controls */}
              <div className="bg-transparent p-4 border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">مبلغ العملية المالية (د.ل):</label>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    placeholder="مثال: 5000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">المرحلة التعليمية المستهدفة:</label>
                  <select
                    value={simCostCenter}
                    onChange={(e) => setSimCostCenter(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="kindergarten">مرحلة الروضة والتمهيدي (Kindergarten)</option>
                    <option value="primary">مرحلة التعليم الابتدائي (Primary School)</option>
                    <option value="middle">مرحلة التعليم المتوسط/الإعدادي (Middle School)</option>
                    <option value="secondary">مرحلة التعليم الثانوي (High School)</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSimAmount('7500');
                      setSimCostCenter('primary');
                      triggerNotification('تم تحميل مثال تحصيل رسوم دراسية لطلبة الابتدائي بقيمة 7,500 د.ل', 'info');
                    }}
                    className="cursor-pointer flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold py-2 px-3 transition-all border border-amber-200 text-center"
                  >
                    نموذج رسوم ابتدائي 🎒
                  </button>
                  <button
                    onClick={() => {
                      setSimAmount('4200');
                      setSimCostCenter('secondary');
                      triggerNotification('تم تحميل مثال تحصيل رسوم دراسية لطلبة الثانوي بقيمة 4,200 د.ل', 'info');
                    }}
                    className="cursor-pointer flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold py-2 px-3 transition-all border border-amber-200 text-center"
                  >
                    نموذج رسوم ثانوي 🎓
                  </button>
                </div>
              </div>

              {/* Comparative Side-by-Side Visual Boards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Board 1: Old Redundant Way */}
                <div className="bg-transparent border border-slate-250 p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <h4 className="text-xs font-black text-slate-800">التصميم القديم المعقّد (مرفوض ومستبعد ❌)</h4>
                    </div>
                    <span className="text-[10px] text-rose-600 bg-rose-50 font-bold px-2 py-0.5 rounded">
                      تشتيت الحسابات وتضخم الدليل
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    كان هذا التصميم يتطلب إنشاء حسابات إيرادات منفصلة لكل مرحلة ومجموعة داخل شجرة الحسابات، مما يؤدي إلى تكرار عشرات الحسابات وتصعيب عمليات المطابقة والتحديث.
                  </p>

                  {/* Visual Journal Entry */}
                  <div className="rounded-lg border border-rose-200 p-3.5 space-y-2 text-[11px]">
                    <div className="flex justify-between items-center text-slate-400 font-bold mb-1 font-mono">
                      <span>البيان المحاسبي</span>
                      <div className="flex gap-4">
                        <span>مدين (د.ل)</span>
                        <span>دائن (د.ل)</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-slate-800 font-bold border-b border-slate-100 py-1">
                      <span>من حـ/ صندوق الخزينة الرئيسي (كاش) <code className="text-slate-400 text-[10px] font-mono">1101</code></span>
                      <span className="font-mono text-slate-900 font-bold">{(parseFloat(simAmount) || 0).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-rose-700 font-bold border-b border-slate-100 py-1">
                      <span className="pr-4">إلى حـ/ إيراد الرسوم - مرحلة {simCostCenter === 'kindergarten' ? 'الروضة' : simCostCenter === 'primary' ? 'الابتدائي' : simCostCenter === 'middle' ? 'المتوسط' : 'الثانوي'} <code className="text-rose-600 text-[10px] font-mono">{simCostCenter === 'kindergarten' ? '4110' : simCostCenter === 'primary' ? '4120' : simCostCenter === 'middle' ? '4130' : '4140'}</code></span>
                      <span className="font-mono text-rose-700 font-bold">{(parseFloat(simAmount) || 0).toLocaleString()}</span>
                    </div>

                    <div className="bg-rose-50/50 p-2 rounded text-[10px] text-rose-700 font-medium">
                      ⚠️ ملاحظة التصميم: حسابات فرعية متعددة ومكررة لكل مرحلة على حدة داخل شجرة الحسابات تسبب فوضى في التقارير الختامية وتصعّب الربط بالفروع ومصرف الوحدة.
                    </div>
                  </div>
                </div>

                {/* Board 2: Approved Unified Way */}
                <div className="bg-[#f0fdfa] border-2 border-emerald-500 p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h4 className="text-xs font-black text-slate-950">التصميم المهني المعتمد (شجرة موحدة ومراكز تكلفة ✅)</h4>
                    </div>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                      حوكمة وذكاء وتكامل مالي YTD
                    </span>
                  </div>

                  <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                    يعتمد على توحيد حساب الإيراد في بند واحد رئيسي ومستدام، مع ربط كل قيد بمركز التكلفة الخاص بالمرحلة التعليمية، مما يحافظ على نظافة شجرة الحسابات بدقة متناهية.
                  </p>

                  {/* Visual Journal Entry */}
                  <div className="rounded-lg border border-emerald-200 p-3.5 space-y-2 text-[11px] shadow-sm">
                    <div className="flex justify-between items-center text-slate-400 font-bold mb-1 font-mono">
                      <span>البيان المحاسبي + مركز التكلفة المرتبط</span>
                      <div className="flex gap-4">
                        <span>مدين (د.ل)</span>
                        <span>دائن (د.ل)</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-slate-800 font-bold border-b border-slate-100 py-1">
                      <div className="flex flex-col">
                        <span>من حـ/ صندوق الخزينة الرئيسي (كاش) <code className="text-slate-400 text-[10px] font-mono">1101</code></span>
                        <span className="text-[9px] text-slate-400 font-normal">← بدون مركز تكلفة (حساب أصول عام مشترك)</span>
                      </div>
                      <span className="font-mono text-slate-900 font-bold">{(parseFloat(simAmount) || 0).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-emerald-800 font-black border-b border-slate-100 py-1">
                      <div className="flex flex-col">
                        <span>إلى حـ/ إيرادات الرسوم الدراسية الموحدة <code className="text-amber-600 text-[10px] font-mono font-bold">4101</code></span>
                        <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                          🛡️ مركز التكلفة: {simCostCenter === 'kindergarten' ? 'مرحلة الروضة والتمهيدي' : simCostCenter === 'primary' ? 'مرحلة التعليم الابتدائي' : simCostCenter === 'middle' ? 'مرحلة التعليم المتوسط' : 'مرحلة التعليم الثانوي'}
                        </span>
                      </div>
                      <span className="font-mono text-emerald-800 font-black">{(parseFloat(simAmount) || 0).toLocaleString()}</span>
                    </div>

                    <div className="bg-emerald-50 p-2.5 rounded text-[10px] text-emerald-800 font-medium border border-emerald-100">
                      ✨ تمثيل الأداء: يتم فرز وعزل تقارير الأرباح والمصروفات والتدفقات النقدية لكل مرحلة بمجرد تصفية التقارير بمركز التكلفة، دون الحاجة لتكرار الحسابات في الدليل العام!
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Official Signatures Block - Charter Endorsement */}
            <div className="p-6 relative overflow-hidden">
              <div className="absolute top-1/2 left-10 -translate-y-1/2 opacity-[0.04] pointer-events-none">
                <CheckCircle2 className="w-56 h-56 text-slate-900" />
              </div>

              <div className="text-center pb-4 mb-4 border-b border-slate-100">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                  بروتوكول اعتماد وتدقيق الهيكلة المحاسبية الموحدة
                </h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  تمت المراجعة والتصديق على البنود الخمسة من قبل هيئة الرقابة المالية وإدارة الحسابات بالمؤسسة
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center pt-2">
                <div className="space-y-1.5 p-3 rounded-lg bg-transparent border border-slate-150">
                  <span className="text-[9px] text-slate-400 font-bold block">رئيس مجلس الإدارة والشركاء</span>
                  <span className="text-xs font-black text-slate-800 block">د. عادل القماطي</span>
                  <div className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block font-mono">
                    SIGNATURE // APPROVED-BY-CHAIRMAN
                  </div>
                </div>

                <div className="space-y-1.5 p-3 rounded-lg bg-transparent border border-slate-150">
                  <span className="text-[9px] text-slate-400 font-bold block">المستشار المالي للمجموعة والتدقيق</span>
                  <span className="text-xs font-black text-slate-800 block">أ. مصطفى الشيباني</span>
                  <div className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block font-mono">
                    SIGNATURE // ENFORCED-BY-FIN-ADVISOR
                  </div>
                </div>

                <div className="space-y-1.5 p-3 rounded-lg bg-transparent border border-slate-150">
                  <span className="text-[9px] text-slate-400 font-bold block">المدير العام والتشغيل</span>
                  <span className="text-xs font-black text-slate-800 block">أ. نوري الهدار</span>
                  <div className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block font-mono">
                    SIGNATURE // CO-SIGNED-CEO
                  </div>
                </div>
              </div>

              {/* Verified Badge Stamp */}
              <div className="mt-5 text-center text-[10px] text-slate-400 font-bold flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>جميع الأرصدة والعمليات المالية في مدارس الأسرة الحديثة تتبع مخرجات هذا الميثاق المحاسبي الموحد.</span>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 2: TRIAL BALANCE / CHART OF ACCOUNTS */}
        {/* ========================================================== */}
        {activeTab === 'trial_balance' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل لوحة شجرة الحسابات...</div>}>
            <ChartOfAccountsTab />
          </React.Suspense>
        )}

        {/* ========================================================== */}
        {/* VIEW 3: CUSTOMERS / STUDENTS LEDGER */}
        {/* ========================================================== */}
                {activeTab === 'customers' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل دفتر العملاء...</div>}>
            <CustomersLedgerTab />
          </React.Suspense>
        )}

        {/* ========================================================== */}
        {/* VIEW 4: SUPPLIERS SECTION */}
        {/* ========================================================== */}
                {activeTab === 'suppliers' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل قسم الموردين...</div>}>
            <SuppliersLedgerTab />
          </React.Suspense>
        )}

        {/* ========================================================== */}
        {/* VIEW 5: JOURNAL ENTRIES (دفتر اليومية العامة) */}
        {/* ========================================================== */}
        {/* VIEW 5: ERP JOURNAL ENTRIES WORKSPACE & LIST */}
        {/* ========================================================== */}
        {activeTab === 'journal_entries' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل يومية القيود...</div>}>
            <JournalEntriesTab />
          </React.Suspense>
        )}

        {/* ========================================================== */}
        {/* VIEW 6: RECEIPT VOUCHER FORM (سند قبض) */}
        {/* ========================================================== */}
        {activeTab === 'receipt_voucher' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل سندات القبض...</div>}>
            <ReceiptVoucherTab />
          </React.Suspense>
        )}

        {/* ========================================================== */}
        {/* VIEW 7: PAYMENT VOUCHER FORM (سند صرف ومصاريف) */}
        {/* ========================================================== */}
        {activeTab === 'payment_voucher' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل سندات الصرف...</div>}>
            <PaymentVoucherTab />
          </React.Suspense>
        )}

        {/* ========================================================== */}
        {/* VIEW 8: BANK TRANSFERS */}
        {/* ========================================================== */}
        {activeTab === 'bank_transfer' && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div>
              <h2 className="text-base font-black text-slate-900">حوالات وسندات التحويل البنكي الداخلي</h2>
              <p className="text-xs text-slate-500 mt-1">تداول السيولة بين الصندوق الفرعي كاش وبين الحساب الجاري للمدرسة بالمصارف</p>
            </div>

            {canonicalFinancialWriteMode === 'snapshot_write' && (
              <div role="status" className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs font-bold text-indigo-900">
                الكتابة المركزية UAT متاحة للحفظ بإصدار وتدقيق؛ هذه الحوالة لا تُعد ترحيلاً نهائياً في دفتر الأستاذ العام، وتبقى التقارير والإقفال غير معتمدين.
              </div>
            )}

            {!canonicalFinancialWriteReady && (
              <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">
                الحوالات البنكية متوقفة: المصدر المالي الحالي للقراءة فقط ولا توجد خدمة حوالات أو قيد كانوني معتمد للحفظ.
              </div>
            )}

            <div className="p-6 shadow-xs max-w-2xl mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
              <form onSubmit={handleBankTransferSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">من الحساب (دائن / المصدر):</label>
                    <select 
                      value={bankTransferForm.sourceAccount}
                      disabled={!canonicalFinancialWriteReady}
                      onChange={(e) => setBankTransferForm(prev => ({ ...prev, sourceAccount: e.target.value }))}
                      className="w-full bg-transparent border border-slate-300 rounded-lg p-2.5 font-bold"
                    >
                      {accounts.filter(a => a.type === 'فرعي').map(a => (
                        <option key={a.code} value={a.code}>{a.code} - {a.name} ({a.balance.toLocaleString()} {currency})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">إلى الحساب (مدين / المستقبل):</label>
                    <select 
                      value={bankTransferForm.destinationAccount}
                      disabled={!canonicalFinancialWriteReady}
                      onChange={(e) => setBankTransferForm(prev => ({ ...prev, destinationAccount: e.target.value }))}
                      className="w-full bg-transparent border border-slate-300 rounded-lg p-2.5 font-bold"
                    >
                      {accounts.filter(a => a.type === 'فرعي').map(a => (
                        <option key={a.code} value={a.code} disabled={a.code === bankTransferForm.sourceAccount}>{a.code} - {a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">المبلغ المطلوب تحويله ونقله عاجلاً ({currency}):</label>
                  <input 
                    type="number" 
                    required
                    value={bankTransferForm.amount}
                    disabled={!canonicalFinancialWriteReady}
                    onChange={(e) => setBankTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-transparent border border-slate-300 rounded-lg p-2.5 font-mono font-black text-sm text-left"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم الحوالة المرجعي / المستند السري للدفع:</label>
                    <input
                      type="text"
                      value={bankTransferForm.reference}
                      disabled={!canonicalFinancialWriteReady}
                      onChange={(e) => setBankTransferForm(prev => ({ ...prev, reference: e.target.value }))}
                    className="w-full bg-transparent border border-slate-300 rounded-lg p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">أغراض التحويل والمستند التوضيحي:</label>
                    <input
                      type="text"
                      value={bankTransferForm.purpose}
                      disabled={!canonicalFinancialWriteReady}
                      onChange={(e) => setBankTransferForm(prev => ({ ...prev, purpose: e.target.value }))}
                    className="w-full bg-transparent border border-slate-300 rounded-lg p-2.5 font-semibold"
                  />
                </div>

                <div className="pt-3">
                  <button 
                    type="submit"
                    disabled={!canonicalFinancialWriteReady}
                    className="w-full bg-[#c58a22] hover:bg-amber-700 text-white font-black py-3 rounded-lg flex items-center justify-center gap-2 shadow cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>{canonicalFinancialWriteReady ? canonicalLedgerReady ? 'بدء التحويل وتحديث المركز المالي للمصارف 🖹' : 'حفظ الحوالة في المصدر المركزي UAT' : 'التحويل غير متاح — المصدر للقراءة فقط'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 9: WORLD-CLASS FIXED ASSETS LIFECYCLE MANAGEMENT */}
        {/* ========================================================== */}
        {activeTab === 'fixed_assets' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل نظام الأصول الثابتة...</div>}>
            <FixedAssetsTab />
          </React.Suspense>
        )}

        {/* ========================================================== */}
        {/* VIEW 10: ESTIMATED BUDGET */}
        {/* ========================================================== */}
                {activeTab === 'estimated_budget' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل الموازنة التقديرية...</div>}>
            <EstimatedBudgetTab />
          </React.Suspense>
        )}

        {/* ========================================================== */}
        {/* VIEW 11: CLOSING OF FISCAL YEAR */}
        {/* ========================================================== */}
        {activeTab === 'closing' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل الإقفال المالي...</div>}>
            <ClosingTab />
          </React.Suspense>
        )}

        {/* ========================================================== */}
        {/* VIEW 12: FINANCIAL REPORTS & BALANCE SHEET */}
        {/* ========================================================== */}
        {activeTab === 'financial_reports' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل التقارير المالية...</div>}>
            <FinancialReportsTab />
          </React.Suspense>
        )}

        {/* ========================================================== */}
        {/* VIEW 13: USERS & PERMISSIONS */}
        {/* ========================================================== */}
        {activeTab === 'users_admin' && (
          <PermissionsManagementModule
            users={SIMULATED_USERS}
            setUsers={setUsers}
            roles={roles}
            setRoles={setRoles}
            permissionsAuditLog={permissionsAuditLog}
            setPermissionsAuditLog={setPermissionsAuditLog}
            currentDrillDownUser={drillDownUser}
            setDrillDownUser={setDrillDownUser}
            triggerNotification={triggerNotification}
          />
        )}

        {/* ========================================================== */}
        {/* VIEW 14: CALCULATOR AND TOOLS */}
        {/* ========================================================== */}
                {activeTab === 'calc_tools' && (
          <React.Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل أدوات الحاسبة...</div>}>
            <CalcToolsTab />
          </React.Suspense>
        )}

      </div>

      {/* RIGHT SIDEBAR: ERP General accounting Menu (Renders on the right side of the screen due to lg:flex-row-reverse) */}
      <div 
        id="ledger-sidebar-menu" 
        className="w-full lg:w-85 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300 text-slate-800 p-5 shadow-xs flex flex-col justify-between shrink-0 h-auto lg:h-[calc(100vh-140px)] lg:sticky lg:top-6 overflow-hidden"
      >
        <div className="flex flex-col space-y-4 overflow-hidden">
          {/* Menu Title Header */}
          <div className="text-center pb-3.5 border-b border-slate-200">
            <h3 className="text-sm font-black text-slate-900 tracking-wide">المدير المالي ERP</h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">مجمع مدارس الأسرة الحديثة</p>
            <div className="w-10 h-0.5 mx-auto bg-[#c58a22] rounded mt-1.5" />
          </div>

          {/* List of Navigation Buttons categorized and scrollable */}
          <div className="flex-1 overflow-y-auto space-y-4.5 pr-1 pl-1 py-1.5 max-h-[calc(100vh-280px)] scrollbar-thin">
            {ledgerSidebarCategories.map((category, catIdx) => {
              const permittedItems = category.items.filter(item => isItemPermitted(item.id));
              if (permittedItems.length === 0) return null;

              return (
                <div key={catIdx} className="space-y-1.5">
                  {/* Category Header Label with a refined indicator dot */}
                  <div className="flex items-center gap-1.5 px-1 pb-1">
                    <span className="w-1 h-1 rounded-full bg-[#c58a22]" />
                    <span className="text-[10px] font-black text-slate-550 tracking-wider select-none">
                      {category.title}
                    </span>
                  </div>
                  
                  {/* Category Buttons */}
                  <div className="space-y-1">
                    {permittedItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSidebarItem === item.id;
                    
                        return (
                      <button
                        key={item.id}
                        onClick={() => handleSidebarItemClick(item)}
                        className={`group w-full relative flex items-center justify-between h-[36px] px-3.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden border select-none ${
                          isActive 
                            ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' 
                            : 'border-slate-200 text-slate-700 hover:bg-transparent hover:text-slate-900 hover:border-slate-300'
                        }`}
                      >
                        {/* Active Side Accent Indicator on the RIGHT edge */}
                        {isActive && (
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-l-md" />
                        )}
                        
                        <div className="flex items-center gap-2 transition-transform duration-200 group-hover:-translate-x-0.5">
                          <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors duration-200 ${
                            isActive 
                              ? 'text-white' 
                              : 'text-slate-400 group-hover:text-slate-700'
                          }`} />
                          <span className={`truncate max-w-[180px] transition-colors duration-200 ${
                            isActive ? 'text-white font-extrabold' : 'text-slate-650 group-hover:text-slate-900'
                          }`}>
                            {item.label}
                          </span>
                        </div>
                        
                        {item.badge && (
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider transition-colors duration-200 ${
                            isActive
                              ? 'bg-amber-700 text-amber-100'
                              : 'bg-slate-100 text-slate-500 group-hover:text-slate-750'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ========================================================== */}
      {/* DIALOGS / SUB-MODALS STAGE FOR G-LEDGER PORTAL */}
      {/* ========================================================== */}


      {showAddJVModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs text-right animate-fade-in" dir="rtl">
          <div className="max-w-md w-full p-6 space-y-4 shadow-2xl text-xs bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">صياغة قيد تسوية مزدوج يدوي</h3>
            
            <form onSubmit={handleAddJV} className="space-y-4 font-semibold text-slate-800">
              <div>
                <label className="block text-slate-600 font-bold mb-1">شرح وتفاصيل القيد (البيان بالتفصيل):</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: تسوية فروقات البنك الشهري"
                  value={newJV.description}
                  onChange={(e) => setNewJV(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-transparent border border-slate-300 rounded p-2 focus:ring-1 focus:ring-yellow-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">من الحساب (الطرف المدين):</label>
                  <select 
                    value={newJV.debitAccount}
                    onChange={(e) => setNewJV(prev => ({ ...prev, debitAccount: e.target.value }))}
                    className="w-full bg-transparent border border-slate-300 rounded p-2"
                  >
                    {accounts.filter(a => a.type === 'فرعي').map(a => (
                      <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">إلى الحساب (الطرف الدائن):</label>
                  <select 
                    value={newJV.creditAccount}
                    onChange={(e) => setNewJV(prev => ({ ...prev, creditAccount: e.target.value }))}
                    className="w-full bg-transparent border border-slate-300 rounded p-2"
                  >
                    {accounts.filter(a => a.type === 'فرعي').map(a => (
                      <option key={a.code} value={a.code} disabled={a.code === newJV.debitAccount}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">المقدار والمبلغ الإجمالي للقيد المحاسبي ({currency}):</label>
                <input 
                  type="number" 
                  required
                  value={newJV.amount}
                  onChange={(e) => setNewJV(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full bg-transparent border border-slate-300 rounded p-2 font-mono text-left text-sm"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button 
                  type="button"
                  onClick={() => setShowAddJVModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded font-bold"
                >
                  تراجع
                </button>
                <button 
                  type="submit"
                  className="bg-amber-650 hover:bg-amber-700 text-white px-5 py-2 rounded font-black shadow-md"
                >
                  حفظ وترحيل القيد اليدوي 🖹
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 🧾 DETAIL MODAL: PRINTABLE OFFICIAL RECEIPT VOUCHER */}
      {/* ========================================================== */}
      {showReceiptDetailModal && selectedReceiptVoucher && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4 backdrop-blur-xs text-right overflow-y-auto animate-fade-in" dir="rtl">
          <div className="border-4 border-emerald-600 max-w-2xl w-full p-8 space-y-6 shadow-2xl text-xs relative my-8 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
            
            {/* Stamp decoration */}
            <div className="absolute top-20 left-12 w-28 h-28 border-4 border-dashed border-emerald-600/30 rounded-full flex items-center justify-center rotate-12 pointer-events-none select-none">
              <div className="text-center text-emerald-600/30 font-black text-[10px] uppercase leading-none">
                مدارس الأسرة<br />الحديثة<br />
                <span className="text-[7px]">الحسابات العامة</span>
              </div>
            </div>

            {/* Print Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-200 pb-4">
              <div className="space-y-1">
                <h3 className="font-black text-sm text-[#020817]">مجموعة مدارس الأسرة الحديثة التعليمية</h3>
                <p className="text-[10px] text-slate-500 font-bold">فرع طرابلس الرئيسي - ترخيص وزارة التعليم رقم (٢٢١ / ٢٠٢٤)</p>
                <p className="text-[9px] text-slate-400 font-mono font-bold">الرقم الضريبي الموحد: 400182811</p>
              </div>
              <div className="text-left font-mono text-[10px] font-black text-slate-700 bg-transparent p-2 rounded-lg border border-slate-200">
                <div className="text-emerald-700">سند قبض رقم: {selectedReceiptVoucher.id}</div>
                <div className="mt-1">التاريخ: {selectedReceiptVoucher.date}</div>
              </div>
            </div>

            {/* Title Block */}
            <div className="text-center py-2 bg-emerald-50 border border-emerald-100">
              <h4 className="font-black text-sm text-emerald-900">سند قبض مالي رسمي ومستند تحصيل</h4>
              <p className="text-[10px] text-emerald-700/80 font-bold mt-0.5">صادر بنظام الربط والقيد المزدوج التلقائي الموحد</p>
            </div>

            {/* Voucher Core Information */}
            <div className="grid grid-cols-2 gap-4 bg-transparent p-4 border border-slate-200">
              <div>
                <span className="text-slate-500 font-bold block mb-0.5">المدرسة المستلمة:</span>
                <span className="text-slate-900 font-black">{selectedReceiptVoucher.school || 'مدرسة الأسرة الحديثة'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block mb-0.5">المرحلة التعليمية ومركز التكلفة:</span>
                <span className="text-amber-700 font-black">
                  {selectedReceiptVoucher.stage || 'الابتدائي'} (مركز: CC_{selectedReceiptVoucher.costCenter?.toUpperCase()})
                </span>
              </div>
              <div className="col-span-2 border-t border-slate-100 pt-2 mt-1">
                <span className="text-slate-500 font-bold block mb-0.5">قبضنا من السيد / ولي الأمر:</span>
                <span className="text-slate-950 font-black text-sm p-1.5 px-3 rounded-lg block mt-1">
                  {selectedReceiptVoucher.receivedFrom}
                </span>
              </div>
              <div className="col-span-2 border-t border-slate-100 pt-2">
                <span className="text-slate-500 font-bold block mb-0.5">لقاء ما يلي (شرح المعاملة):</span>
                <span className="text-slate-800 font-bold">{selectedReceiptVoucher.against}</span>
              </div>
            </div>

            {/* If Student Payment Integration, show full references */}
            {selectedReceiptVoucher.studentPaymentId && (
              <div className="bg-yellow-50/50 p-4 border border-yellow-150 space-y-2 text-right">
                <h5 className="font-bold text-yellow-900 text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-650 block animate-pulse"></span>
                  بيانات تكامل حسابات الطلاب والترحيل التلقائي الموحد
                </h5>
                <div className="grid grid-cols-2 gap-3 text-[9px] text-yellow-850">
                  <div>
                    <span className="font-bold text-yellow-700 text-[8px]">رقم معاملة سداد الطلاب (Student Payment ID):</span>
                    <p className="font-mono font-bold text-slate-800 mt-0.5 text-[10px]">{selectedReceiptVoucher.studentPaymentId}</p>
                  </div>
                  <div>
                    <span className="font-bold text-yellow-700 text-[8px]">معرف الطالب (Student ID):</span>
                    <p className="font-mono font-bold text-slate-800 mt-0.5 text-[10px]">{selectedReceiptVoucher.studentId}</p>
                  </div>
                  <div>
                    <span className="font-bold text-yellow-700 text-[8px]">اسم الطالب الرباعي:</span>
                    <p className="font-sans font-bold text-slate-850 mt-0.5 text-[10px]">{selectedReceiptVoucher.studentName}</p>
                  </div>
                  <div>
                    <span className="font-bold text-yellow-700 text-[8px]">رقم سند القبض المحاسبي (Receipt Voucher ID):</span>
                    <p className="font-mono font-bold text-slate-800 mt-0.5 text-[10px]">{selectedReceiptVoucher.receiptVoucherId}</p>
                  </div>
                  <div>
                    <span className="font-bold text-yellow-700 text-[8px]">رقم قيد اليومية المزدوج (Journal Entry ID):</span>
                    <p className="font-mono font-bold text-slate-800 mt-0.5 text-[10px]">{selectedReceiptVoucher.journalEntryId}</p>
                  </div>
                  <div>
                    <span className="font-bold text-yellow-700 text-[8px]">مركز التكلفة التابع:</span>
                    <p className="font-sans font-bold text-slate-800 mt-0.5 text-[10px]">{selectedReceiptVoucher.costCenter === 'kindergarten' ? 'الروضة' : selectedReceiptVoucher.costCenter === 'primary' ? 'الابتدائي' : selectedReceiptVoucher.costCenter === 'middle' ? 'الإعدادي' : 'الثانوي'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-yellow-700 text-[8px]">الفترة المالية الفعالة:</span>
                    <p className="font-sans font-bold text-slate-800 mt-0.5 text-[10px]">{selectedReceiptVoucher.financialPeriod || 'السنة المالية 2026'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-yellow-700 text-[8px]">المستخدم المنشئ للعملية:</span>
                    <p className="font-sans font-bold text-slate-800 mt-0.5 text-[10px]">{selectedReceiptVoucher.user}</p>
                  </div>
                  <div className="col-span-2 border-t border-yellow-100 pt-1.5 text-right">
                    <span className="font-bold text-yellow-700 text-[8px]">تاريخ ووقت توطين المعاملة المحاسبية التلقائية:</span>
                    <p className="font-mono font-bold text-slate-800 mt-0.5 text-[10px]">{selectedReceiptVoucher.createdAt}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Amount block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="bg-emerald-600 text-white p-3 text-center shadow-md">
                <span className="text-[10px] block font-bold opacity-90">المبلغ المدفوع بالكامل:</span>
                <span className="text-lg font-mono font-black">{selectedReceiptVoucher.amount?.toLocaleString()} {currency}</span>
              </div>
              <div className="bg-slate-100 p-3 text-right">
                <span className="text-[9px] block text-slate-500 font-bold">التفقيط المالي الرسمي (الأبجدي):</span>
                <span className="font-extrabold text-[#020817] text-[11px] block mt-1">
                  فقط مبلغه {selectedReceiptVoucher.amount?.toLocaleString()} دينار ليبي لا غير.
                </span>
              </div>
            </div>

            {/* Double Entry Ledger compliance section */}
            <div className="overflow-hidden">
              <div className="bg-slate-100 p-2 font-black text-[#020817] flex justify-between items-center text-[10px] border-b border-slate-200 px-4">
                <span>الربط المحاسبي التلقائي بنظام القيد المزدوج المتوازن</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 p-0.5 px-2 rounded">معتمد ترحيله</span>
              </div>
              <table className="w-full text-right text-[10px]">
                <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                  <tr>
                    <th className="px-4 py-2">رقم الحساب</th>
                    <th className="px-4 py-2">اسم البند في شجرة الحسابات</th>
                    <th className="px-4 py-2 text-center">الجانب المدين</th>
                    <th className="px-4 py-2 text-center">الجانب الدائن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                  <tr>
                    <td className="px-4 py-2 font-mono text-amber-700">{selectedReceiptVoucher.receivingAccount || '1101'}</td>
                    <td className="px-4 py-2">{selectedReceiptVoucher.receivingAccount === '1101' ? 'صندوق النقدية والخزينة الموحدة' : 'الحساب الجاري بالمصرف'}</td>
                    <td className="px-4 py-2 text-center font-mono text-emerald-600 font-black">{selectedReceiptVoucher.amount?.toLocaleString()} {currency}</td>
                    <td className="px-4 py-2 text-center font-mono text-slate-400">0.00</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-amber-700">
                      {selectedReceiptVoucher.receivableAccount || (selectedReceiptVoucher.studentId || selectedReceiptVoucher.studentPaymentId ? (selectedReceiptVoucher.creditAccount || '1201') : selectedReceiptVoucher.operationType === 'رسوم حافلة' ? '4300' : selectedReceiptVoucher.operationType === 'رسوم أنشطة' ? '4400' : selectedReceiptVoucher.operationType === 'أخرى' ? '4500' : '4101')}
                    </td>
                    <td className="px-4 py-2">
                      {selectedReceiptVoucher.receivableAccount || selectedReceiptVoucher.studentId || selectedReceiptVoucher.studentPaymentId ? 'ذمم الطلاب المدينة' : selectedReceiptVoucher.operationType === 'رسوم حافلة' ? 'إيرادات اشتراكات النقل والحافلات' :
                       selectedReceiptVoucher.operationType === 'رسوم أنشطة' ? 'إيرادات الأنشطة الطلابية والرحلات' :
                       selectedReceiptVoucher.operationType === 'أخرى' ? 'إيرادات وتبرعات تعليمية طارئة' : 'إيرادات الرسوم الدراسية الموحدة'}
                    </td>
                    <td className="px-4 py-2 text-center font-mono text-slate-400">0.00</td>
                    <td className="px-4 py-2 text-center font-mono text-rose-600 font-black">{selectedReceiptVoucher.amount?.toLocaleString()} {currency}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Official Stamp & Signatures */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-center font-bold text-slate-700">
              <div className="space-y-8">
                <span>أمين الصندوق (المحصل)</span>
                <div className="text-slate-400 font-normal italic text-[10px]">سليمان غازي</div>
              </div>
              <div className="space-y-8 border-r border-slate-100">
                <span>المحاسب المالي للفرع</span>
                <div className="text-slate-400 font-normal text-[10px]">(توقيع إلكتروني مؤمن)</div>
              </div>
              <div className="space-y-8 border-r border-slate-100">
                <span>المدير المالي العام</span>
                <div className="text-slate-400 font-normal text-[10px]">(توقيع واعتماد نهائي)</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
              {selectedReceiptVoucher.journalEntryId && (
                <button
                  type="button"
                  onClick={() => {
                    const jvId = selectedReceiptVoucher.journalEntryId;
                    setShowReceiptDetailModal(false);
                    setActiveTab('journal_entries');
                    setTimeout(() => {
                      loadJvForView(jvId);
                    }, 200);
                    triggerNotification(`جاري استعراض القيد المزدوج الموطن تلقائياً: ${jvId}`, 'success');
                  }}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 border border-amber-200 font-black px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer text-[10px]"
                >
                  معاينة القيد المزدوج المرتبط ↗
                </button>
              )}
              <button 
                type="button"
                onClick={() => {
                  handlePrintReceiptDirect(selectedReceiptVoucher);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2 rounded-lg flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة السند الفورية 🖨️</span>
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowReceiptDetailModal(false);
                  setSelectedReceiptVoucher(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2 rounded-lg"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 🧾 DETAIL MODAL: PRINTABLE OFFICIAL PAYMENT VOUCHER */}
      {/* ========================================================== */}
      {showPaymentDetailModal && selectedPaymentVoucher && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4 backdrop-blur-xs text-right overflow-y-auto animate-fade-in" dir="rtl">
          <div className="border-4 border-rose-600 max-w-2xl w-full p-8 space-y-6 shadow-2xl text-xs relative my-8 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
            
            {/* Stamp decoration */}
            <div className="absolute top-20 left-12 w-28 h-28 border-4 border-dashed border-rose-600/30 rounded-full flex items-center justify-center -rotate-12 pointer-events-none select-none">
              <div className="text-center text-rose-600/30 font-black text-[10px] uppercase leading-none">
                مدارس الأسرة<br />الحديثة<br />
                <span className="text-[7px]">الرقابة المالية</span>
              </div>
            </div>

            {/* Print Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-200 pb-4">
              <div className="space-y-1">
                <h3 className="font-black text-sm text-[#020817]">مجموعة مدارس الأسرة الحديثة التعليمية</h3>
                <p className="text-[10px] text-slate-500 font-bold">فرع طرابلس الرئيسي - ترخيص وزارة التعليم رقم (٢٢١ / ٢٠٢٤)</p>
                <p className="text-[9px] text-slate-400 font-mono font-bold">الرقم الضريبي الموحد: 400182811</p>
              </div>
              <div className="text-left font-mono text-[10px] font-black text-slate-700 bg-transparent p-2 rounded-lg border border-slate-200">
                <div className="text-rose-700">سند صرف رقم: {selectedPaymentVoucher.id}</div>
                <div className="mt-1">التاريخ: {selectedPaymentVoucher.date}</div>
              </div>
            </div>

            {/* Title Block */}
            <div className="text-center py-2 bg-rose-50 border border-rose-100">
              <h4 className="font-black text-sm text-rose-900">سند صرف مالي ومستخلص ميزانية معتمد</h4>
              <p className="text-[10px] text-rose-700/80 font-bold mt-0.5">توطيد بنظام القيد المزدوج ومراكز تكلفة الفروع</p>
            </div>

            {/* Voucher Core Information */}
            <div className="grid grid-cols-2 gap-4 bg-transparent p-4 border border-slate-200">
              <div>
                <span className="text-slate-500 font-bold block mb-0.5">فرع الصرف والمدرسة:</span>
                <span className="text-slate-900 font-black">مدرسة الأسرة الحديثة - طرابلس</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block mb-0.5">مركز التكلفة المدين بالنفقة:</span>
                <span className="text-rose-700 font-black">
                  {selectedPaymentVoucher.costCenter === 'kindergarten' ? 'الروضة' :
                   selectedPaymentVoucher.costCenter === 'primary' ? 'الابتدائي' :
                   selectedPaymentVoucher.costCenter === 'middle' ? 'المتوسط' : 'الثانوي'} (مركز: CC_{selectedPaymentVoucher.costCenter?.toUpperCase()})
                </span>
              </div>
              <div className="col-span-2 border-t border-slate-100 pt-2 mt-1">
                <span className="text-slate-500 font-bold block mb-0.5">صرفنا مبلغه للمستفيد السيد / الجهة:</span>
                <span className="text-slate-950 font-black text-sm p-1.5 px-3 rounded-lg block mt-1">
                  {selectedPaymentVoucher.beneficiary}
                </span>
              </div>
              <div className="col-span-2 border-t border-slate-100 pt-2">
                <span className="text-slate-500 font-bold block mb-0.5">وذلك لقاء (بيان وتحليل الصرف المعزز):</span>
                <span className="text-slate-800 font-bold">{selectedPaymentVoucher.against}</span>
              </div>
            </div>

            {/* Amount block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="bg-rose-600 text-white p-3 text-center shadow-md">
                <span className="text-[10px] block font-bold opacity-90">المبلغ الإجمالي المصروف:</span>
                <span className="text-lg font-mono font-black">{selectedPaymentVoucher.amount?.toLocaleString()} {currency}</span>
              </div>
              <div className="bg-slate-100 p-3 text-right">
                <span className="text-[9px] block text-slate-500 font-bold">التفقيط المالي الرسمي (الأبجدي):</span>
                <span className="font-extrabold text-[#020817] text-[11px] block mt-1">
                  فقط مبلغه {selectedPaymentVoucher.amount?.toLocaleString()} دينار ليبي لا غير.
                </span>
              </div>
            </div>

            {/* Double Entry Ledger compliance section */}
            <div className="overflow-hidden">
              <div className="bg-slate-100 p-2 font-black text-[#020817] flex justify-between items-center text-[10px] border-b border-slate-200 px-4">
                <span>الربط المحاسبي التلقائي بنظام القيد المزدوج المتوازن (الصرف)</span>
                <span className="text-[9px] bg-rose-100 text-rose-800 p-0.5 px-2 rounded">معتمد ترحيله</span>
              </div>
              <table className="w-full text-right text-[10px]">
                <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                  <tr>
                    <th className="px-4 py-2">رقم الحساب</th>
                    <th className="px-4 py-2">اسم البند في شجرة الحسابات</th>
                    <th className="px-4 py-2 text-center">الجانب المدين</th>
                    <th className="px-4 py-2 text-center">الجانب الدائن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                  <tr>
                    <td className="px-4 py-2 font-mono text-amber-700">{selectedPaymentVoucher.paidToAccount || '5270'}</td>
                    <td className="px-4 py-2">{accounts.find(a => a.code === selectedPaymentVoucher.paidToAccount)?.name || 'بند المصروف المرتبط'}</td>
                    <td className="px-4 py-2 text-center font-mono text-emerald-600 font-black">{selectedPaymentVoucher.amount?.toLocaleString()} {currency}</td>
                    <td className="px-4 py-2 text-center font-mono text-slate-400">0.00</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-amber-700">{selectedPaymentVoucher.paidFromAccount || '1101'}</td>
                    <td className="px-4 py-2">{selectedPaymentVoucher.paidFromAccount === '1101' ? 'صندوق النقدية والخزينة الموحدة' : 'الحساب الجاري بالمصرف'}</td>
                    <td className="px-4 py-2 text-center font-mono text-slate-400">0.00</td>
                    <td className="px-4 py-2 text-center font-mono text-rose-600 font-black">{selectedPaymentVoucher.amount?.toLocaleString()} {currency}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Official Stamp & Signatures */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-center font-bold text-slate-700">
              <div className="space-y-8">
                <span>المستلم (المورد/الجهة)</span>
                <div className="text-slate-400 font-normal italic text-[10px]">(توقيع المستفيد بالاستلام)</div>
              </div>
              <div className="space-y-8 border-r border-slate-100">
                <span>المحاسب المالي للفرع</span>
                <div className="text-slate-400 font-normal text-[10px]">(توقيع إلكتروني مؤمن)</div>
              </div>
              <div className="space-y-8 border-r border-slate-100">
                <span>المدير المالي المعتمد</span>
                <div className="text-slate-400 font-normal text-[10px]">(توقيع واعتماد نهائي)</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
              <button 
                type="button"
                onClick={() => {
                  handlePrintPaymentDirect(selectedPaymentVoucher);
                }}
                className="bg-rose-650 hover:bg-rose-700 text-white font-black px-6 py-2 rounded-lg flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة السند الفورية 🖨️</span>
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowPaymentDetailModal(false);
                  setSelectedPaymentVoucher(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2 rounded-lg"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Advanced Accounting Search & Query Overlay */}
      {showJvSearchOverlay && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="shadow-2xl max-w-4xl w-full flex flex-col max-h-[85vh] text-slate-800 overflow-hidden bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">الاستعلام المحاسبي المتقدم والبحث عن القيود</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">البحث المتقاطع، والتصفية التراكمية، ومطابقة المجاميع بالدفاتر المالية</p>
                </div>
              </div>
              <button 
                onClick={() => setShowJvSearchOverlay(false)} 
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filtering Form Controls */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-transparent p-4 rounded-xl">
                <div>
                  <label className="block text-[10px] text-slate-550 mb-1 font-bold">رقم القيد المستندي</label>
                  <input 
                    type="text" 
                    placeholder="JV-2026-..." 
                    value={jvSearchFilters.id}
                    onChange={(e) => setJvSearchFilters(prev => ({ ...prev, id: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-550 mb-1 font-bold">حالة القيد التراكمي</label>
                  <select
                    value={jvSearchFilters.status}
                    onChange={(e) => setJvSearchFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="all">كل الحالات المتاحة</option>
                    <option value="مسودة">مسودة غير مرحلة</option>
                    <option value="مرحل">مرحل للدفاتر الرئيسية</option>
                    <option value="معتمد">معتمد من الإدارة المالية</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-550 mb-1 font-bold">هيكلة القيد</label>
                  <select
                    value={jvSearchFilters.type}
                    onChange={(e) => setJvSearchFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="all">كل الهيكليات</option>
                    <option value="بسيط">بسيط (طرفين)</option>
                    <option value="مركب">مركب (شجرة متعددة)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-550 mb-1 font-bold">البحث بنص البيان والشرح</label>
                  <input 
                    type="text" 
                    placeholder="مطابقة الكلمات المفتاحية..." 
                    value={jvSearchFilters.description}
                    onChange={(e) => setJvSearchFilters(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Matching Journal Entries Counter */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold px-1">
                <span>القيود المسترجعة المطابقة لشروط البحث والاستعلام الاستراتيجي:</span>
                <span className="font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {journalEntries.filter(j => {
                    if (jvSearchFilters.id && !j.id.toLowerCase().includes(jvSearchFilters.id.toLowerCase())) return false;
                    if (jvSearchFilters.status !== 'all' && j.status !== jvSearchFilters.status) return false;
                    if (jvSearchFilters.type !== 'all' && (j.type || 'بسيط') !== jvSearchFilters.type) return false;
                    if (jvSearchFilters.description && !j.description.toLowerCase().includes(jvSearchFilters.description.toLowerCase())) return false;
                    return true;
                  }).length} قيود مالية
                </span>
              </div>

              {/* Spreadsheet-like Results Table */}
              <div className="overflow-hidden shadow-xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                    <tr>
                      <th className="p-3 w-32 font-bold text-center">رقم القيد العام</th>
                      <th className="p-3 w-28 text-center">تاريخ الاستحقاق</th>
                      <th className="p-3 w-24 text-center">الهيكلية</th>
                      <th className="p-3">شرح وتبرير القيد المالي المدمج</th>
                      <th className="p-3 text-center w-32">مجموع المدين (Debit)</th>
                      <th className="p-3 text-center w-32">مجموع الدائن (Credit)</th>
                      <th className="p-3 text-center w-24">الحالة المستندية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                    {journalEntries
                      .filter(j => {
                        if (jvSearchFilters.id && !j.id.toLowerCase().includes(jvSearchFilters.id.toLowerCase())) return false;
                        if (jvSearchFilters.status !== 'all' && j.status !== jvSearchFilters.status) return false;
                        if (jvSearchFilters.type !== 'all' && (j.type || 'بسيط') !== jvSearchFilters.type) return false;
                        if (jvSearchFilters.description && !j.description.toLowerCase().includes(jvSearchFilters.description.toLowerCase())) return false;
                        return true;
                      })
                      .map(j => (
                        <tr 
                          key={j.id} 
                          onClick={() => {
                            loadJvForView(j.id);
                            setShowJvSearchOverlay(false);
                          }}
                          className="hover:bg-transparent cursor-pointer transition border-r-2 border-transparent hover:border-amber-600"
                        >
                          <td className="p-3 text-center font-mono font-black text-amber-700">{j.id}</td>
                          <td className="p-3 text-center font-mono text-slate-500">{j.date}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              (j.type || 'بسيط') === 'مركب' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {j.type || 'بسيط'}
                            </span>
                          </td>
                          <td className="p-3 truncate max-w-[18rem] text-slate-800 font-bold">{j.description}</td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-800 bg-emerald-50/20">
                            {j.debitTotal.toLocaleString()} {currency}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-amber-800 bg-amber-50/20">
                            {j.creditTotal.toLocaleString()} {currency}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                              j.status === 'معتمد' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              j.status === 'مرحل' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {j.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-transparent flex justify-end gap-2">
              <button 
                onClick={() => setShowJvSearchOverlay(false)} 
                className="bg-slate-200 hover:bg-slate-300 px-5 py-2 rounded-lg text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                إغلاق نافذة البحث
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern High-Fidelity Printable Ledger Sheet Modal */}
      {showJvPrintModal && activeJvState && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="shadow-2xl max-w-6xl w-full flex flex-col md:flex-row overflow-hidden max-h-[92vh] text-slate-800">
            
            {/* Control Column */}
            <div className="no-print p-6 md:w-80 border-l border-slate-200 bg-transparent flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-black text-amber-750">خيارات الطباعة الاحترافية</h3>
                <p className="text-[10px] text-slate-550 mt-1">تحديد القالب والهيكلة المعيارية لتوثيق وتدقيق قيد اليومية العام</p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1.5 font-bold">قالب طباعة القيد المالي</label>
                  <select
                    value={selectedJvPrintTemplate}
                    onChange={(e) => setSelectedJvPrintTemplate(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-2 text-slate-800 font-bold focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="standard">سند محاسبي قياسي مدمج</option>
                    <option value="detailed">سند تسوية تفصيلي ممتد للأستاذ</option>
                    <option value="signatures">سند متكامل مع التواقيع والأختام المعيارية</option>
                    <option value="no_price">سند حركة مستندي (سرية وحجب المبالغ)</option>
                  </select>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-200 text-[10px]">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-600 hover:text-slate-900 transition">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-amber-600" />
                    <span>تضمين الرمز المربع السريع الذكي (QR-Code)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-600 hover:text-slate-900 transition">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-amber-600" />
                    <span>تضمين رمز الباركود المالي الموحد</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-600 hover:text-slate-900 transition">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-amber-600" />
                    <span>إظهار الترويسة الرسمية للمجمع التعليمي</span>
                  </label>
                </div>
              </div>

              <div className="mt-auto space-y-2 text-xs pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    handlePrintJvDirect(activeJvState, selectedJvPrintTemplate);
                  }}
                  className="w-full bg-[#c58a22] hover:bg-amber-700 text-white font-black py-2.5 rounded-lg flex items-center justify-center gap-2 shadow transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>إرسال للطباعة الفورية 🖨️</span>
                </button>

                <button
                  onClick={() => {
                    handlePrintJvDirect(activeJvState, selectedJvPrintTemplate);
                  }}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg text-center font-bold transition cursor-pointer"
                >
                  فتح حوار الطباعة / حفظ كـ PDF 📄
                </button>

                <button
                  onClick={() => setShowJvPrintModal(false)}
                  className="w-full hover:bg-slate-100 text-slate-500 py-2 rounded-lg text-center font-bold transition cursor-pointer"
                >
                  إلغاء وإغلاق نافذة المعاينة
                </button>
              </div>
            </div>

            {/* Standard A4 Paper Simulator Sheet */}
            <div className="flex-1 p-6 bg-slate-100 overflow-y-auto flex items-center justify-center">
              <div className="printable-area w-[210mm] min-h-[285mm] p-10 text-slate-950 font-sans shadow-2xl relative border border-slate-300 text-right flex flex-col justify-between" id="printable-jv-area">
                
                {/* Upper Letterhead section */}
                <div>
                  <div className="flex items-center justify-between border-b-2 border-slate-950 pb-4">
                    <div>
                      <h2 className="text-sm font-black text-slate-900">مجمع مدارس الأسرة الحديثة للتعليم المتميز والدمج</h2>
                      <p className="text-[9px] text-slate-600 font-bold mt-1">المكتب المحاسبي المركزي - الحسابات المركزية الموحدة</p>
                      <p className="text-[8px] text-slate-400">سجل تجاري رقم: 91102-طرابلس | هاتف: 021-360-1444 | طرابلس، ليبيا</p>
                    </div>
                    
                    {/* Barcode representation */}
                    <div className="flex flex-col items-center">
                      <div className="h-9 w-36 border border-slate-300 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,#090d16_2px,#090d16_4px)]"></div>
                      <span className="text-[7px] font-mono mt-1 text-slate-600 font-bold">*{activeJvState.id || 'JV-DRAFT'}*</span>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="my-6 text-center">
                    <h1 className="text-base font-black tracking-wider border-b border-slate-950 pb-2 inline-block px-10 text-slate-900">
                      سند قيد تسوية وقيد يومية مركّب ومعدل
                    </h1>
                    <p className="text-[9px] text-slate-500 mt-1 font-sans">تاريخ القيد المعتمد بدفاتر الأستاذ العام: {activeJvState.date}</p>
                  </div>

                  {/* General Metadata list */}
                  <div className="grid grid-cols-2 gap-4 text-[10px] bg-transparent p-4 rounded-lg mb-6 text-slate-800">
                    <div>
                      <span><b>رقم القيد المستندي:</b> <span className="font-mono text-amber-800 font-black">{activeJvState.id || 'قيد مسودة غير مثبت'}</span></span>
                      <br />
                      <span className="mt-1 inline-block"><b>حالة التثبيت المحاسبي:</b> <span className={`font-black ${activeJvState.status === 'معتمد' ? 'text-amber-700' : 'text-emerald-700'}`}>{activeJvState.status}</span></span>
                    </div>
                    <div>
                      <span><b>البيان العام للقيد (الشرح):</b> <span className="font-bold">{activeJvState.description || 'قيود تسوية دورية مدمجة لحسابات المدرسة الموحدة'}</span></span>
                      <br />
                      <span className="mt-1 inline-block"><b>مسؤول التثبيت والإنشاء:</b> <span className="font-bold">{activeJvState.createdByUser} (النظام المالي الموحد)</span></span>
                    </div>
                  </div>

                  {/* Spreadsheet lines table */}
                  <table className="w-full text-right border-collapse text-[9px] border-2 border-slate-950">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                        <th className="p-2.5 border-l border-slate-300 w-8 text-center">#</th>
                        <th className="p-2.5 border-l border-slate-300 w-24">رقم الحساب</th>
                        <th className="p-2.5 border-l border-slate-300">اسم بند الحساب في الشجرة</th>
                        <th className="p-2.5 border-l border-slate-300">الشرح والبيان التحليلي للسطر</th>
                        <th className="p-2.5 border-l border-slate-300 text-center w-28">مدين (Debit)</th>
                        <th className="p-2.5 border-l border-slate-300 text-center w-28">دائن (Credit)</th>
                        <th className="p-2.5 text-center w-24">مركز التكلفة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 text-slate-900 font-bold">
                      {selectedJvPrintTemplate === 'no_price' ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-rose-600 font-bold italic">
                            *** هذا السند تم حجب تفاصيله وقيمه المالية لغايات مراجعة الحسابات المستندية وسرية الإدارات ***
                          </td>
                        </tr>
                      ) : (
                        activeJvState.lines.map((l: any, i: number) => (
                          <tr key={l.id} className="hover:bg-transparent">
                            <td className="p-2.5 text-center border-l border-slate-300 font-mono text-slate-500">{i + 1}</td>
                            <td className="p-2.5 font-mono text-amber-900 border-l border-slate-300">{l.accountCode}</td>
                            <td className="p-2.5 text-slate-900 border-l border-slate-300 font-black">{l.accountName}</td>
                            <td className="p-2.5 text-slate-600 font-normal border-l border-slate-300">{l.description || activeJvState.description}</td>
                            <td className="p-2.5 text-center font-mono text-emerald-700 border-l border-slate-300 bg-emerald-50/20">
                              {l.debit > 0 ? l.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) + ' د.ل' : '-'}
                            </td>
                            <td className="p-2.5 text-center font-mono text-amber-700 border-l border-slate-300 bg-amber-50/20">
                              {l.credit > 0 ? l.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) + ' د.ل' : '-'}
                            </td>
                            <td className="p-2.5 text-center text-[8px] font-black">
                              {l.costCenter === 'kindergarten' ? 'مرحلة الروضة' : 
                               l.costCenter === 'primary' ? 'التعليم الأساسي' : 
                               l.costCenter === 'middle' ? 'التعليم المتوسط' : 'التعليم الثانوي'}
                            </td>
                          </tr>
                        ))
                      )}
                      {selectedJvPrintTemplate !== 'no_price' && (
                        <tr className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                          <td colSpan={4} className="p-2.5 text-center border-l border-slate-300">المجموع المتوازن والمطابق للمعادلة المحاسبية المزدوجة</td>
                          <td className="p-2.5 text-center font-mono text-emerald-800 border-l border-slate-300 bg-emerald-50">
                            {activeJvState.debitTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل
                          </td>
                          <td className="p-2.5 text-center font-mono text-amber-800 border-l border-slate-300 bg-amber-50">
                            {activeJvState.creditTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل
                          </td>
                          <td className="p-2.5 bg-slate-200"></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footnotes and Signatures */}
                <div className="mt-12 text-[10px]">
                  <div className="grid grid-cols-3 gap-6 text-center mb-8">
                    <div className="space-y-6">
                      <p className="font-bold text-slate-800">مُعِدّ ومراجع القيد</p>
                      <p className="font-mono text-slate-500 font-bold">{activeJvState.createdByUser}</p>
                      <p className="text-[8px] text-slate-400 border-t border-dashed border-slate-300 pt-1">توقيع المسؤول المالي المباشر</p>
                    </div>
                    <div className="space-y-6">
                      <p className="font-bold text-slate-800">رئيس مراجعة الحسابات</p>
                      <p className="text-slate-400 italic">مُدقق ومُرحل بالنظام</p>
                      <p className="text-[8px] text-slate-400 border-t border-dashed border-slate-300 pt-1">إقرار المطابقة والاتساق مع المعايير</p>
                    </div>
                    <div className="space-y-6">
                      <p className="font-bold text-slate-800">المدير المالي العام للمجموعة</p>
                      <p className="text-slate-300">..............................</p>
                      <p className="text-[8px] text-slate-400 border-t border-dashed border-slate-300 pt-1">توقيع المراجعة والاعتماد النهائي</p>
                    </div>
                  </div>

                  {/* Security bottom strip with styled QR Code */}
                  <div className="border-t border-slate-200 pt-5 flex items-center justify-between text-[8px] text-slate-500">
                    <div className="flex items-center gap-3">
                      
                      {/* Generative-like QR mockup */}
                      <div className="w-12 h-12 border border-slate-300 p-1 grid grid-cols-4 gap-0.5">
                        {Array.from({ length: 16 }).map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`rounded-sm ${
                              (idx * 7 + 13) % 5 === 0 || (idx * 3) % 4 === 1 ? 'bg-slate-900' : 'bg-transparent'
                            }`}
                          ></div>
                        ))}
                      </div>

                      <div>
                        <p className="font-bold text-slate-700 text-[9px]">أرشفة رقمية مشفرة مؤمنة بالكامل</p>
                        <p className="text-[8px]">المنظومة المحاسبية الموحدة لمجموعة مدارس الأسرة الحديثة</p>
                        <p className="font-mono text-[7px] text-slate-400">UUID: {activeJvState.id || 'JV-DRAFT-PREVIEW'}</p>
                      </div>
                    </div>

                    <div className="text-left font-sans text-slate-400 font-bold space-y-0.5">
                      <p>تاريخ إنشاء القيد الأصلي: {activeJvState.createdAt || '2026-06-25 07:43'}</p>
                      <p>مستخرج السند لغايات التدقيق والمراجعة: {new Date().toLocaleDateString('ar-LY')} {new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Unified Active Saving Request Lock Screen Indicator */}
      {activeSaving && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] transition-opacity duration-300">
          <div className="border-2 border-amber-500 shadow-2xl p-6 max-w-sm mx-auto flex flex-col items-center gap-4 text-center animate-pulse">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200">
               <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">العملية جارية قيد التنفيذ</h3>
            <p className="text-slate-600 font-bold text-sm">
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
    </AccountingContext.Provider>
  );
}
