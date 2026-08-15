import { 
  Activity, 
  AlertTriangle, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  ArrowUpRight, 
  Building, 
  Calculator, 
  Calendar, 
  Check, 
  CheckCircle2, 
  Coins, 
  CreditCard, 
  DollarSign, 
  FileCheck2, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  History, 
  Layers, 
  Lock, 
  Plus, 
  Printer, 
  RefreshCw, 
  Scale, 
  Search, 
  ShieldCheck, 
  SlidersHorizontal, 
  TrendingDown, 
  TrendingUp, 
  UserCheck, 
  Wallet, 
  XCircle 
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { 
  TreasuryAccount, 
  TreasuryTransaction, 
  PaymentInstrumentConfig, 
  PaymentInstrumentType, 
  TreasuryTransactionStatus, 
  TreasuryTransfer,
  AuditLog
} from '../types';
import { EnterpriseLogger } from '../database/services/EnterpriseLogger';
import { TreasuryRepository } from '../database/repositories/TreasuryRepository';
import { TreasuryEngine, TreasuryTxInput } from '../database/services/TreasuryEngine';
import { BankAccountService } from '../database/services/BankAccountService';
import { CashManagementService } from '../database/services/CashManagementService';
import { PaymentInstrumentService } from '../database/services/PaymentInstrumentService';
import { TreasuryTransferService } from '../database/services/TreasuryTransferService';
import { TreasuryTransferRepository } from '../database/repositories/TreasuryTransferRepository';
import { AuditRepository } from '../database/repositories/AuditRepository';
import { PostingEngine } from '../database/services/PostingEngine';
import { useCurrency } from '../utils/currency';
import EnterpriseActionToolbar from './shared/EnterpriseActionToolbar';

interface TreasuryPlatformPortalProps {
  selectedSchool: { id: string; name: string };
  triggerNotification: (text: string, type: 'info' | 'warning' | 'success') => void;
  logAction: (action: string, details: string, module: string) => void;
  setActiveSection?: (section: string) => void;
}

// Helper: Convert number to Arabic words for official receipts
function numberToArabicWords(num: number): string {
  if (num === 0) return 'صفر دينار';
  const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسعمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  
  const intPart = Math.floor(num);
  const fracPart = Math.round((num - intPart) * 100);
  
  let result = '';
  if (intPart >= 1000) {
    const thousands = Math.floor(intPart / 1000);
    const remainder = intPart % 1000;
    if (thousands === 1) result += 'ألف ';
    else if (thousands === 2) result += 'ألفان ';
    else if (thousands <= 10) result += units[thousands] + ' آلاف ';
    else result += thousands + ' ألف ';
    if (remainder > 0) result += 'و';
  }
  
  const rem = intPart % 1000;
  if (rem >= 100) {
    const h = Math.floor(rem / 100);
    result += hundreds[h] + ' ';
    if (rem % 100 > 0) result += 'و';
  }
  
  const t = rem % 100;
  if (t > 0) {
    if (t <= 9) result += units[t];
    else if (t <= 19) {
      const u = t % 10;
      result += (u === 0 ? 'عشرة' : units[u] + ' عشر');
    } else {
      const u = t % 10;
      const ten = Math.floor(t / 10);
      if (u > 0) result += units[u] + ' و' + tens[ten];
      else result += tens[ten];
    }
  }
  
  result = result.trim() + ' دينار';
  if (fracPart > 0) {
    result += ` و ${fracPart} درهم`;
  }
  return result + ' لا غير';
}

export default function TreasuryPlatformPortal({ 
  selectedSchool, 
  triggerNotification, 
  logAction,
  setActiveSection
}: TreasuryPlatformPortalProps) {
  
  const { format: formatCurrency } = useCurrency();
  const schoolId = selectedSchool.id;

  // Primary Domain State
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [transfers, setTransfers] = useState<TreasuryTransfer[]>([]);
  const [instruments, setInstruments] = useState<PaymentInstrumentConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Filtering & Navigation State
  const [activeTab, setActiveTab] = useState<'overview' | 'vouchers' | 'transfers' | 'cash-count' | 'bank-reconciliation' | 'instruments' | 'audit-trail'>('overview');
  const [searchTxQuery, setSearchTxQuery] = useState('');
  const [selectedTxType, setSelectedTxType] = useState<string>('all');
  const [selectedTxStatus, setSelectedTxStatus] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals Controls
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showReceiptVoucherModal, setShowReceiptVoucherModal] = useState(false);
  const [showDisbursementVoucherModal, setShowDisbursementVoucherModal] = useState(false);
  const [showAddTransferModal, setShowAddTransferModal] = useState(false);
  const [selectedTxForLifecycle, setSelectedTxForLifecycle] = useState<TreasuryTransaction | null>(null);
  const [selectedTransferForLifecycle, setSelectedTransferForLifecycle] = useState<TreasuryTransfer | null>(null);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<TreasuryTransaction | null>(null);

  // Cash Inventory / Denomination Audit State
  const [selectedChestForCount, setSelectedChestForCount] = useState<string>('');
  const [denominationCounts, setDenominationCounts] = useState<{ [key: string]: number }>({
    '50': 0,
    '20': 0,
    '10': 0,
    '5': 0,
    '1': 0,
    '0.5': 0,
    '0.25': 0
  });
  const [countAuditHistory, setCountAuditHistory] = useState<any[]>([]);

  // Bank Reconciliation State
  const [selectedBankForRecon, setSelectedBankForRecon] = useState<string>('');
  const [bankStatementEndingBalance, setBankStatementEndingBalance] = useState<number>(0);
  const [bankStatementDate, setBankStatementDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [clearedTxIds, setClearedTxIds] = useState<string[]>([]);

  // Form States
  const [newAccountForm, setNewAccountForm] = useState({
    name: '',
    code: '',
    type: 'Branch Chest' as any,
    glAccountId: '',
    currency: 'LYD',
    allowNegativeBalance: false,
    notes: ''
  });

  const [receiptVoucherForm, setReceiptVoucherForm] = useState({
    payerName: '',
    category: 'رسوم دراسية',
    destinationAccountId: '',
    amount: 0,
    currency: 'LYD',
    paymentInstrument: 'Cash' as PaymentInstrumentType,
    paymentInstrumentDetails: '',
    description: '',
    notes: ''
  });

  const [disbursementVoucherForm, setDisbursementVoucherForm] = useState({
    beneficiaryName: '',
    category: 'مصروفات تشغيلية',
    sourceAccountId: '',
    amount: 0,
    currency: 'LYD',
    paymentInstrument: 'Cash' as PaymentInstrumentType,
    paymentInstrumentDetails: '',
    description: '',
    notes: ''
  });

  const [transferForm, setTransferForm] = useState({
    sourceAccountId: '',
    destinationAccountId: '',
    amount: 0,
    paymentInstrument: 'Cash' as PaymentInstrumentType,
    paymentInstrumentDetails: '',
    description: '',
    notes: ''
  });

  // Load All Primary Data
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const accList = await TreasuryRepository.getAllAccounts(schoolId);
      const txList = await TreasuryRepository.getAllTransactions(schoolId);
      const trsfList = await TreasuryTransferRepository.getAll(schoolId);
      const instList = await PaymentInstrumentService.getAvailableInstruments();
      const logs = await AuditRepository.getAll(schoolId);

      setAccounts(accList);
      setTransactions(txList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setTransfers(trsfList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setInstruments(instList);
      setAuditLogs(logs.filter(l => l.module === 'TREASURY_ENGINE' || l.module === 'TREASURY_TRANSFER_SERVICE' || l.module === 'الخزانة والمدفوعات'));

      if (accList.length > 0) {
        if (!selectedChestForCount) {
          const firstChest = accList.find(a => a.type === 'Main Chest' || a.type === 'Branch Chest');
          if (firstChest) setSelectedChestForCount(firstChest.id);
        }
        if (!selectedBankForRecon) {
          const firstBank = accList.find(a => a.type === 'Bank Account');
          if (firstBank) setSelectedBankForRecon(firstBank.id);
        }
      }
    } catch (err: any) {
      EnterpriseLogger.error("Error loading Treasury data", "TreasuryPlatformPortal", { error: err });
      triggerNotification(`فشل تحميل بيانات الخزينة والبنوك: ${err.message}`, 'warning');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId]);

  // Create New Account (Chest / Bank)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (newAccountForm.type === 'Bank Account') {
        await BankAccountService.registerBankAccount(schoolId, newAccountForm);
      } else {
        await CashManagementService.registerChest(schoolId, newAccountForm);
      }
      triggerNotification(`✓ تم تسجيل حساب الخزينة/البنك الجديد (${newAccountForm.name}) بنجاح.`, 'success');
      logAction('CREATE_TREASURY_ACCOUNT', `إنشاء حساب خزينة جديد برمز ${newAccountForm.code}`, 'الخزانة والمدفوعات');
      setShowAddAccountModal(false);
      setNewAccountForm({
        name: '',
        code: '',
        type: 'Branch Chest',
        glAccountId: '',
        currency: 'LYD',
        allowNegativeBalance: false,
        notes: ''
      });
      loadData();
    } catch (err: any) {
      triggerNotification(`خطأ تسجيل: ${err.message}`, 'warning');
    }
  };

  // Create Receipt Voucher (سند قبض)
  const handleCreateReceiptVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (receiptVoucherForm.amount <= 0) {
        triggerNotification('يرجى إدخال مبلغ صحيح لسند القبض', 'warning');
        return;
      }
      if (!receiptVoucherForm.destinationAccountId) {
        triggerNotification('يرجى اختيار حساب الخزينة أو البنك المستهدف للإيداع', 'warning');
        return;
      }

      const input: TreasuryTxInput = {
        type: 'Deposit',
        destinationAccountId: receiptVoucherForm.destinationAccountId,
        amount: receiptVoucherForm.amount,
        currency: receiptVoucherForm.currency,
        paymentInstrument: receiptVoucherForm.paymentInstrument,
        paymentInstrumentDetails: receiptVoucherForm.paymentInstrumentDetails,
        description: `سند قبض: [${receiptVoucherForm.category}] من (${receiptVoucherForm.payerName}) - ${receiptVoucherForm.description}`,
        notes: receiptVoucherForm.notes,
        referenceType: 'receipt_voucher',
        referenceId: `RCV-${Date.now().toString().slice(-6)}`
      };

      const tx = await TreasuryEngine.recordTransaction(schoolId, input, {
        userId: 'admin_treasury',
        userName: 'أمين الصندوق / المحاسب',
        userRole: 'Accountant',
        ipAddress: '127.0.0.1'
      });

      triggerNotification(`✓ تم تقييد سند القبض الجديد رقم (${tx.id}) بنجاح.`, 'success');
      logAction('CREATE_RECEIPT_VOUCHER', `إنشاء سند قبض رقم ${tx.id} بقيمة ${tx.amount}`, 'الخزانة والمدفوعات');
      setShowReceiptVoucherModal(false);
      
      setReceiptVoucherForm({
        payerName: '',
        category: 'رسوم دراسية',
        destinationAccountId: '',
        amount: 0,
        currency: 'LYD',
        paymentInstrument: 'Cash',
        paymentInstrumentDetails: '',
        description: '',
        notes: ''
      });
      loadData();
    } catch (err: any) {
      triggerNotification(`خطأ تقييد سند القبض: ${err.message}`, 'warning');
    }
  };

  // Create Disbursement Voucher (سند صرف)
  const handleCreateDisbursementVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (disbursementVoucherForm.amount <= 0) {
        triggerNotification('يرجى إدخال مبلغ صحيح لسند الصرف', 'warning');
        return;
      }
      if (!disbursementVoucherForm.sourceAccountId) {
        triggerNotification('يرجى اختيار حساب الخزينة أو البنك المصدر للصرف', 'warning');
        return;
      }

      const input: TreasuryTxInput = {
        type: 'Withdrawal',
        sourceAccountId: disbursementVoucherForm.sourceAccountId,
        amount: disbursementVoucherForm.amount,
        currency: disbursementVoucherForm.currency,
        paymentInstrument: disbursementVoucherForm.paymentInstrument,
        paymentInstrumentDetails: disbursementVoucherForm.paymentInstrumentDetails,
        description: `سند صرف: [${disbursementVoucherForm.category}] إلى (${disbursementVoucherForm.beneficiaryName}) - ${disbursementVoucherForm.description}`,
        notes: disbursementVoucherForm.notes,
        referenceType: 'disbursement_voucher',
        referenceId: `DSB-${Date.now().toString().slice(-6)}`
      };

      const tx = await TreasuryEngine.recordTransaction(schoolId, input, {
        userId: 'admin_treasury',
        userName: 'أمين الصندوق / المحاسب',
        userRole: 'Accountant',
        ipAddress: '127.0.0.1'
      });

      triggerNotification(`✓ تم تقييد سند الصرف الجديد رقم (${tx.id}) بنجاح.`, 'success');
      logAction('CREATE_DISBURSEMENT_VOUCHER', `إنشاء سند صرف رقم ${tx.id} بقيمة ${tx.amount}`, 'الخزانة والمدفوعات');
      setShowDisbursementVoucherModal(false);

      setDisbursementVoucherForm({
        beneficiaryName: '',
        category: 'مصروفات تشغيلية',
        sourceAccountId: '',
        amount: 0,
        currency: 'LYD',
        paymentInstrument: 'Cash',
        paymentInstrumentDetails: '',
        description: '',
        notes: ''
      });
      loadData();
    } catch (err: any) {
      triggerNotification(`خطأ تقييد سند الصرف: ${err.message}`, 'warning');
    }
  };

  // Create Inter-Chest / Bank Transfer
  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (transferForm.sourceAccountId === transferForm.destinationAccountId) {
        triggerNotification('لا يمكن التحويل لنفس الحساب المصدر والمستهدف', 'warning');
        return;
      }
      if (transferForm.amount <= 0) {
        triggerNotification('يرجى إدخال مبلغ تحويل أكبر من الصفر', 'warning');
        return;
      }

      const transfer = await TreasuryTransferService.createTransfer(
        schoolId,
        {
          sourceAccountId: transferForm.sourceAccountId,
          destinationAccountId: transferForm.destinationAccountId,
          amount: transferForm.amount,
          paymentInstrument: transferForm.paymentInstrument,
          paymentInstrumentDetails: transferForm.paymentInstrumentDetails,
          description: transferForm.description,
          notes: transferForm.notes
        },
        {
          userId: 'admin_treasury',
          userName: 'المدير المالي',
          userRole: 'Accountant',
          ipAddress: '127.0.0.1'
        }
      );

      triggerNotification(`✓ تم تسجيل طلب التحويل البيني رقم (${transfer.id}) في حالة مسودة بنجاح.`, 'success');
      logAction('CREATE_TREASURY_TRANSFER', `إنشاء طلب تحويل نقدية بيني رقم ${transfer.id}`, 'الخزانة والمدفوعات');
      setShowAddTransferModal(false);
      setTransferForm({
        sourceAccountId: '',
        destinationAccountId: '',
        amount: 0,
        paymentInstrument: 'Cash',
        paymentInstrumentDetails: '',
        description: '',
        notes: ''
      });
      loadData();
    } catch (err: any) {
      triggerNotification(`خطأ إجراء التحويل: ${err.message}`, 'warning');
    }
  };

  // Toggle Payment Instrument Status
  const handleToggleInstrument = async (instrument: PaymentInstrumentType, currentStatus: boolean) => {
    try {
      await PaymentInstrumentService.configureInstrument(instrument, !currentStatus, 'تحديث عبر لوحة إدارة الخزينة');
      triggerNotification(`✓ تم تحديث حالة وسيلة الدفع (${instrument}) بنجاح.`, 'success');
      logAction('TOGGLE_PAYMENT_INSTRUMENT', `تحديث وسيلة الدفع ${instrument} إلى ${!currentStatus ? 'مفعل' : 'معطل'}`, 'الخزانة والمدفوعات');
      loadData();
    } catch (err: any) {
      triggerNotification(`فشل التحديث: ${err.message}`, 'warning');
    }
  };

  // Process Transaction Lifecycle Transition
  const handleLifecycleTransition = async (txId: string, status: TreasuryTransactionStatus) => {
    try {
      const updated = await TreasuryEngine.processTransition(schoolId, txId, status, {
        userId: 'admin_treasury',
        userName: 'المدير المالي المعتمد',
        userRole: 'Accountant',
        ipAddress: '127.0.0.1'
      });
      triggerNotification(`✓ تم نقل المعاملة (${txId}) إلى الحالة [${status}] بنجاح.`, 'success');
      logAction('TREASURY_TRANSITION', `ترقية المعاملة ${txId} إلى الحالة ${status}`, 'الخزانة والمدفوعات');
      setSelectedTxForLifecycle(null);
      loadData();
    } catch (err: any) {
      triggerNotification(`فشل ترقية المستند: ${err.message}`, 'warning');
    }
  };

  // Process Transfer Lifecycle Transition
  const handleTransferTransition = async (transferId: string, action: 'submit' | 'approve' | 'execute' | 'cancel') => {
    try {
      const operator = { userId: 'admin_treasury', userName: 'المدير المالي المعتمد', userRole: 'Accountant', ipAddress: '127.0.0.1' };
      if (action === 'submit') {
        await TreasuryTransferService.submitForApproval(schoolId, transferId, operator);
        triggerNotification(`✓ تم تقديم طلب التحويل رقم (${transferId}) للموافقة والاعتماد.`, 'success');
      } else if (action === 'approve') {
        await TreasuryTransferService.approveTransfer(schoolId, transferId, operator);
        triggerNotification(`✓ تم اعتماد طلب التحويل رقم (${transferId}) بنجاح.`, 'success');
      } else if (action === 'execute') {
        await TreasuryTransferService.executeTransfer(schoolId, transferId, operator);
        triggerNotification(`✓ تم تنفيذ التحويل النقدي وترحيل الأثر المالي في دفتر الأستاذ بنجاح.`, 'success');
      } else if (action === 'cancel') {
        await TreasuryTransferService.cancelTransfer(schoolId, transferId, operator);
        triggerNotification(`✓ تم إلغاء أمر التحويل رقم (${transferId}).`, 'info');
      }
      setSelectedTransferForLifecycle(null);
      loadData();
    } catch (err: any) {
      triggerNotification(`فشل تغيير حالة التحويل: ${err.message}`, 'warning');
    }
  };

  // Physical Cash Count Audit Calculations
  const selectedChestAccount = accounts.find(a => a.id === selectedChestForCount);
  const totalCountedCash = Object.entries(denominationCounts).reduce((sum: number, [denom, count]: [string, number]) => {
    return sum + (parseFloat(denom) * (Number(count) || 0));
  }, 0);
  const chestBookBalance = selectedChestAccount ? selectedChestAccount.balance : 0;
  const cashDiscrepancy = totalCountedCash - chestBookBalance;

  // Confirm Physical Cash Inventory
  const handleConfirmCashAudit = async () => {
    if (!selectedChestAccount) return;
    try {
      if (cashDiscrepancy !== 0) {
        // Record corrective entry for cash discrepancy
        const input: TreasuryTxInput = {
          type: cashDiscrepancy > 0 ? 'Deposit' : 'Withdrawal',
          destinationAccountId: cashDiscrepancy > 0 ? selectedChestAccount.id : undefined,
          sourceAccountId: cashDiscrepancy < 0 ? selectedChestAccount.id : undefined,
          amount: Math.abs(cashDiscrepancy),
          currency: selectedChestAccount.currency,
          paymentInstrument: 'Cash',
          description: `تسوية جرد خزينة: [${cashDiscrepancy > 0 ? 'زيادة جرد' : 'عجز جرد'}] بالصندوق (${selectedChestAccount.name}). الرصيد الفعلي: ${totalCountedCash}`,
          notes: `تم المحضر بحضور لجنة الجرد. الفارق: ${cashDiscrepancy}`
        };

        const tx = await TreasuryEngine.recordTransaction(schoolId, input, {
          userId: 'admin_treasury',
          userName: 'مفتش الجرد المالي',
          userRole: 'Auditor',
          ipAddress: '127.0.0.1'
        });
        await TreasuryEngine.processTransition(schoolId, tx.id, 'Executed', { userId: 'admin_treasury', userName: 'مفتش الجرد', userRole: 'Auditor', ipAddress: '127.0.0.1' });
        await TreasuryEngine.processTransition(schoolId, tx.id, 'Posted', { userId: 'admin_treasury', userName: 'مفتش الجرد', userRole: 'Auditor', ipAddress: '127.0.0.1' });
      }

      const auditRecord = {
        id: `AUD-CASH-${Date.now()}`,
        chestId: selectedChestAccount.id,
        chestName: selectedChestAccount.name,
        date: new Date().toISOString(),
        bookBalance: chestBookBalance,
        countedBalance: totalCountedCash,
        discrepancy: cashDiscrepancy,
        status: cashDiscrepancy === 0 ? 'مطابقة تامّة' : cashDiscrepancy > 0 ? 'زيادة جرد' : 'عجز جرد'
      };

      setCountAuditHistory([auditRecord, ...countAuditHistory]);
      triggerNotification(`✓ تم حفظ واعتماد محضر جرد الخزينة (${selectedChestAccount.name}) وتسوية الفروقات.`, 'success');
      logAction('CASH_COUNT_AUDIT', `اعتماد محضر جرد خزينة ${selectedChestAccount.name} بفارق ${cashDiscrepancy}`, 'الخزانة والمدفوعات');
      
      // Reset count
      setDenominationCounts({ '50': 0, '20': 0, '10': 0, '5': 0, '1': 0, '0.5': 0, '0.25': 0 });
      loadData();
    } catch (err: any) {
      triggerNotification(`خطأ اعتماد محضر الجرد: ${err.message}`, 'warning');
    }
  };

  // Bank Reconciliation Calculations
  const selectedBankAccount = accounts.find(a => a.id === selectedBankForRecon);
  const bankTxs = transactions.filter(t => t.sourceAccountId === selectedBankForRecon || t.destinationAccountId === selectedBankForRecon);
  
  const unclearedDeposits = bankTxs
    .filter(t => t.type === 'Deposit' && !clearedTxIds.includes(t.id) && t.status !== 'Cancelled')
    .reduce((sum, t) => sum + t.amount, 0);

  const unpresentedChecks = bankTxs
    .filter(t => t.type === 'Withdrawal' && !clearedTxIds.includes(t.id) && t.status !== 'Cancelled')
    .reduce((sum, t) => sum + t.amount, 0);

  const adjustedBookBalance = (selectedBankAccount ? selectedBankAccount.balance : 0) + unclearedDeposits - unpresentedChecks;
  const reconciliationDifference = adjustedBookBalance - bankStatementEndingBalance;

  // Toggle Cleared Item in Reconciliation
  const toggleClearedTx = (id: string) => {
    if (clearedTxIds.includes(id)) {
      setClearedTxIds(clearedTxIds.filter(i => i !== id));
    } else {
      setClearedTxIds([...clearedTxIds, id]);
    }
  };

  // Finalize Bank Reconciliation
  const handleFinalizeBankReconciliation = async () => {
    if (!selectedBankAccount) return;
    try {
      for (const id of clearedTxIds) {
        const tx = transactions.find(t => t.id === id);
        if (tx && tx.status !== 'Reconciled') {
          await TreasuryEngine.processTransition(schoolId, id, 'Reconciled', {
            userId: 'admin_treasury',
            userName: 'مراجع التسويات البنكية',
            userRole: 'Auditor',
            ipAddress: '127.0.0.1'
          });
        }
      }

      triggerNotification(`✓ تم اعتماد مذكرة التسوية البنكية لحساب (${selectedBankAccount.name}) وتحديث ${clearedTxIds.length} معاملة إلى حالة (Reconciled).`, 'success');
      logAction('BANK_RECONCILIATION', `اعتماد تسوية بنكية لحساب ${selectedBankAccount.name}`, 'الخزانة والمدفوعات');
      loadData();
    } catch (err: any) {
      triggerNotification(`فشل اعتماد التسوية البنكية: ${err.message}`, 'warning');
    }
  };

  // Filter Transactions list
  const filteredTxs = transactions.filter(tx => {
    const matchesSearch = tx.id.toLowerCase().includes(searchTxQuery.toLowerCase()) || 
                          tx.description.toLowerCase().includes(searchTxQuery.toLowerCase()) || 
                          (tx.referenceId && tx.referenceId.toLowerCase().includes(searchTxQuery.toLowerCase()));
    
    const matchesType = selectedTxType === 'all' || tx.type === selectedTxType;
    const matchesStatus = selectedTxStatus === 'all' || tx.status === selectedTxStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="w-full min-h-screen text-right font-sans dir-rtl select-none transition-all duration-300 bg-gradient-to-br from-[#f8f5ee] via-[#efe9dc] to-[#e8e0d0] text-slate-900 p-2 sm:p-4 md:p-6 space-y-6" dir="rtl">
      
      {/* 1. Header & Action Toolbar */}
      <EnterpriseActionToolbar
        title="إدارة الخزائن والمدفوعات والمطابقات البنكية"
        stats={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="text-slate-300 font-bold">الحسابات النشطة: <span className="text-amber-400 font-mono font-black">{accounts.length}</span></span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300 font-bold">صافي السيولة النقدية: <span className="text-emerald-400 font-mono font-black">{formatCurrency(accounts.reduce((sum, a) => sum + a.balance, 0), true)}</span></span>
          </div>
        }
        onNew={() => setShowAddAccountModal(true)}
        onRefresh={loadData}
        onPrint={() => window.print()}
        onExportPdf={() => {}}
        onExportExcel={() => {}}
        onImportExcel={() => {}}
        onDownloadTemplate={() => {}}
        onExit={setActiveSection ? () => setActiveSection('dashboard') : undefined}
      />

      <div className="p-4 sm:p-6 space-y-6">
        
        {/* Quick Helper Action Buttons */}
        <div className="flex flex-wrap justify-between items-center gap-3 no-print p-3 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <div className="flex flex-wrap gap-2">
            <button 
              type="button"
              onClick={() => setShowReceiptVoucherModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ سند قبض جديد (Deposit)</span>
            </button>
            <button 
              type="button"
              onClick={() => setShowDisbursementVoucherModal(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ سند صرف جديد (Withdrawal)</span>
            </button>
            <button 
              type="button"
              onClick={() => setShowAddTransferModal(true)}
              className="bg-[#c58a22] hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>+ تحويل نقدية بيني (Transfer)</span>
            </button>
          </div>

          <button 
            type="button"
            onClick={() => setShowAddAccountModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Building className="w-4 h-4 text-yellow-400" />
            <span>تسجيل صندوق / حساب بنك</span>
          </button>
        </div>

        {/* 2. Live Treasury Accounts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map(acc => {
            const isBank = acc.type === 'Bank Account';
            const isMain = acc.type === 'Main Chest';
            return (
              <div key={acc.id} className="p-5 relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <div className={`absolute top-0 right-0 left-0 h-1.5 ${isBank ? 'bg-[#c58a22]' : isMain ? 'bg-[#d4af37]' : 'bg-emerald-600'}`} />
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{acc.type}</span>
                    <h4 className="font-extrabold text-slate-900 mt-1 text-sm">{acc.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">الرمز: {acc.code} | GL: {acc.glAccountId}</p>
                  </div>
                  <div className={`p-2.5 ${isBank ? 'bg-amber-50 text-amber-600' : 'bg-yellow-50 text-yellow-600'}`}>
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">الرصيد الفعلي المتوفر:</span>
                    <span className="text-xl font-black text-slate-900 font-mono">{formatCurrency(acc.balance, true)}</span>
                  </div>
                  {acc.allowNegativeBalance && (
                    <span className="text-[9px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded font-bold">سحب مكشوف</span>
                  )}
                </div>
              </div>
            );
          })}
          
          {accounts.length === 0 && (
            <div className="lg:col-span-4 p-8 text-center border-dashed text-slate-400 text-xs">
              لا توجد حسابات خزينة أو بنوك مسجلة حالياً. يرجى البدء بتسجيل صندوق نقدية أو حساب بنكي.
            </div>
          )}
        </div>

        {/* 3. Navigation Sub-Tabs Bar */}
        <div className="flex overflow-x-auto border-b border-slate-200 gap-2 pb-1 text-xs sm:text-sm font-bold p-2 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-4 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'overview' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'}`}
          >
            <Activity className="w-4 h-4 text-yellow-400" />
            <span>📊 ملخص الحسابات والسيولة</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('vouchers')}
            className={`py-2 px-4 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'vouchers' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'}`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>📜 حركة المقبوضات والمصروفات والسندات</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('transfers')}
            className={`py-2 px-4 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'transfers' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'}`}
          >
            <ArrowRightLeft className="w-4 h-4 text-amber-400" />
            <span>🔄 التحويلات النقدية البينية</span>
          </button>

          <button 
            onClick={() => setActiveTab('cash-count')}
            className={`py-2 px-4 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'cash-count' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'}`}
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>🔍 جرد الخزينة ومطابقة الفئات</span>
          </button>

          <button 
            onClick={() => setActiveTab('bank-reconciliation')}
            className={`py-2 px-4 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'bank-reconciliation' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'}`}
          >
            <Scale className="w-4 h-4 text-teal-400" />
            <span>🏛️ التسويات والمطابقات البنكية</span>
          </button>

          <button 
            onClick={() => setActiveTab('instruments')}
            className={`py-2 px-4 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'instruments' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'}`}
          >
            <CreditCard className="w-4 h-4 text-purple-400" />
            <span>💳 وسائل وقنوات الدفع</span>
          </button>

          <button 
            onClick={() => setActiveTab('audit-trail')}
            className={`py-2 px-4 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'audit-trail' ? 'bg-gradient-to-r from-[#9a6a1d] via-[#d4af37] to-[#c58a22] text-slate-950 shadow-md' : 'text-amber-900/70 hover:text-amber-950 hover:bg-amber-100/50'}`}
          >
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <span>🛡️ النزاهة والرقابة المالية</span>
          </button>
        </div>

        {/* =========================================================================
           TAB 1: OVERVIEW & CASHFLOW DASHBOARD
           ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Metrics & Inflow/Outflow Breakdown */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <h3 className="font-extrabold text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>تحليل التدفقات النقدية وموقف الخزينة</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-600 font-bold block">إجمالي المقبوضات والإيداعات</span>
                      <span className="text-2xl font-black text-emerald-800 font-mono mt-1 block">
                        {formatCurrency(transactions.filter(t => t.type === 'Deposit' && t.status !== 'Cancelled').reduce((sum, t) => sum + t.amount, 0), true)}
                      </span>
                    </div>
                    <ArrowDownLeft className="w-8 h-8 text-emerald-400" />
                  </div>
                  
                  <div className="p-4 bg-rose-50 border border-rose-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-rose-600 font-bold block">إجمالي المسحوبات والتأديات</span>
                      <span className="text-2xl font-black text-rose-800 font-mono mt-1 block">
                        {formatCurrency(transactions.filter(t => t.type === 'Withdrawal' && t.status !== 'Cancelled').reduce((sum, t) => sum + t.amount, 0), true)}
                      </span>
                    </div>
                    <ArrowUpRight className="w-8 h-8 text-rose-400" />
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">معاملات الخزينة بانتظار الاعتماد المستندي:</span>
                  <span className="bg-amber-100 text-amber-800 font-mono font-bold px-2.5 py-1 rounded-full text-xs">
                    {transactions.filter(t => t.status === 'Pending Approval').length} معاملة
                  </span>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <h4 className="font-extrabold text-slate-900 text-sm mb-3">سياسة الرقابة الماليّة وإثبات القيود (Governance Policy)</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  تلتزم منصة EduPro Enterprise بمعايير القيد المزدوج والرقابة المالية الصارمة. تخضع جميع التحركات النقدية بين الصناديق والبنوك لرقابة الآلة المستندية (StateMachine)، حيث يُمنع التعديل المباشر أو حذف السندات بعد التترحيل والاعتماد المحاسبي.
                </p>
              </div>
            </div>

            {/* Right Column: Tenant & Security Policy */}
            <div className="space-y-6">
              <div className="p-5 space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <ShieldCheck className="w-4 h-4 text-yellow-600" />
                  <span>سلامة البيانات والعزل المؤسسي (Tenant Security)</span>
                </h4>
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>حماية الحسابات البنكية والصناديق من التداخل المتبادل.</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>ربط آلي بغير قابل للتلاعب بدفتر الأستاذ العام (GL).</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>تتبع كامل للتسلسلات الزمنية والـ Audit Trail.</span>
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
           TAB 2: VOUCHERS (RECEIPTS & DISBURSEMENTS)
           ========================================================================= */}
        {activeTab === 'vouchers' && (
          <div className="space-y-4">
            
            {/* Filters Bar */}
            <div className="p-4 flex flex-wrap gap-4 items-center justify-between text-xs bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="ابحث برقم المستند، البيان..."
                    value={searchTxQuery}
                    onChange={(e) => setSearchTxQuery(e.target.value)}
                    className="bg-transparent rounded-lg px-3 py-1.5 pr-8 text-xs focus:focus:ring-1 focus:ring-yellow-500 focus:outline-none font-bold"
                  />
                  <Search className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                </div>

                <select 
                  value={selectedTxType}
                  onChange={(e) => setSelectedTxType(e.target.value)}
                  className="bg-transparent rounded-lg px-3 py-1.5 text-xs focus:focus:outline-none font-bold"
                >
                  <option value="all">كافة أنواع المعاملات</option>
                  <option value="Deposit">سندات قبض (Deposits)</option>
                  <option value="Withdrawal">سندات صرف (Withdrawals)</option>
                </select>

                <select 
                  value={selectedTxStatus}
                  onChange={(e) => setSelectedTxStatus(e.target.value)}
                  className="bg-transparent rounded-lg px-3 py-1.5 text-xs focus:focus:outline-none font-bold"
                >
                  <option value="all">كافة الحالات المستندية</option>
                  <option value="Draft">مسودة (Draft)</option>
                  <option value="Pending Approval">بانتظار الاعتماد</option>
                  <option value="Approved">معتمدة (Approved)</option>
                  <option value="Executed">منفذة فعلياً (Executed)</option>
                  <option value="Posted">مرحلة عامة (Posted)</option>
                  <option value="Reconciled">مطابقة بنكياً (Reconciled)</option>
                  <option value="Cancelled">ملغية (Cancelled)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowReceiptVoucherModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>سند قبض</span>
                </button>
                <button 
                  onClick={() => setShowDisbursementVoucherModal(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>سند صرف</span>
                </button>
              </div>
            </div>

            {/* Vouchers Table */}
            <div className="overflow-hidden bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                    <tr>
                      <th className="px-4 py-3">رقم المستند والبيان</th>
                      <th className="px-4 py-3">نوع الحركة</th>
                      <th className="px-4 py-3">الحساب المصدر</th>
                      <th className="px-4 py-3">الحساب المستهدف</th>
                      <th className="px-4 py-3 text-left">المبلغ</th>
                      <th className="px-4 py-3 text-center">الوسيلة</th>
                      <th className="px-4 py-3 text-center">الحالة</th>
                      <th className="px-4 py-3 text-center">الإجراءات والطباعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                    {filteredTxs.map(tx => {
                      const srcAccount = accounts.find(a => a.id === tx.sourceAccountId);
                      const destAccount = accounts.find(a => a.id === tx.destinationAccountId);
                      
                      const statusColors = {
                        'Draft': 'bg-slate-100 text-slate-700 border-slate-200',
                        'Pending Approval': 'bg-amber-100 text-amber-700 border-amber-200',
                        'Approved': 'bg-orange-100 text-orange-700 border-orange-200',
                        'Executed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
                        'Posted': 'bg-amber-100 text-amber-700 border-amber-200',
                        'Reconciled': 'bg-teal-100 text-teal-700 border-teal-200',
                        'Cancelled': 'bg-rose-100 text-rose-700 border-rose-200',
                        'Reversed': 'bg-purple-100 text-purple-700 border-purple-200',
                        'Archived': 'bg-slate-200 text-slate-800 border-slate-300'
                      };

                      return (
                        <tr key={tx.id} className="hover:bg-transparent transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900 font-mono">{tx.id}</div>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{tx.description}</p>
                          </td>
                          <td className="px-4 py-3.5 font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${tx.type === 'Deposit' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              {tx.type === 'Deposit' ? 'سند قبض' : 'سند صرف'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-600">{srcAccount ? srcAccount.name : '—'}</td>
                          <td className="px-4 py-3.5 font-medium text-slate-600">{destAccount ? destAccount.name : '—'}</td>
                          <td className="px-4 py-3.5 text-left font-black font-mono text-slate-900">{formatCurrency(tx.amount, true)}</td>
                          <td className="px-4 py-3.5 text-center font-bold text-slate-600">{tx.paymentInstrument}</td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors[tx.status] || 'bg-slate-100'}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => setSelectedTxForLifecycle(tx)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded text-[10px] font-bold"
                              >
                                التحكم بالحالة
                              </button>
                              <button 
                                onClick={() => setSelectedVoucherForPrint(tx)}
                                className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1"
                              >
                                <Printer className="w-3 h-3" />
                                <span>طباعة السند</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredTxs.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                          لا توجد سندات قبض أو صرف مطابقة للفلاتر المحددة.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
           TAB 3: INTER-CHEST & BANK TRANSFERS
           ========================================================================= */}
        {activeTab === 'transfers' && (
          <div className="space-y-4">
            
            <div className="p-4 flex justify-between items-center text-xs bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">إدارة التحويلات النقدية والبنكية البينية</h4>
                <p className="text-slate-500 mt-0.5">تحويل الأموال بين الصناديق الفرعية والحسابات البنكية المركزية وفق معايير الحماية والأستاذ العام</p>
              </div>

              <button 
                onClick={() => setShowAddTransferModal(true)}
                className="bg-[#c58a22] hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>+ طلب تحويل بيني جديد</span>
              </button>
            </div>

            {/* Transfers Table */}
            <div className="overflow-hidden bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                    <tr>
                      <th className="px-4 py-3">رقم التحويل والبيان</th>
                      <th className="px-4 py-3">تاريخ التحويل</th>
                      <th className="px-4 py-3">من حساب (المصدر)</th>
                      <th className="px-4 py-3">إلى حساب (المستهدف)</th>
                      <th className="px-4 py-3 text-left">مبلغ التحويل</th>
                      <th className="px-4 py-3 text-center">الوسيلة</th>
                      <th className="px-4 py-3 text-center">الحالة</th>
                      <th className="px-4 py-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                    {transfers.map(trsf => {
                      const srcAcc = accounts.find(a => a.id === trsf.sourceAccountId);
                      const destAcc = accounts.find(a => a.id === trsf.destinationAccountId);

                      return (
                        <tr key={trsf.id} className="hover:bg-transparent transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900 font-mono">{trsf.id}</div>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{trsf.description}</p>
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-600">{trsf.transferDate}</td>
                          <td className="px-4 py-3.5 font-bold text-slate-800">{srcAcc ? srcAcc.name : '—'}</td>
                          <td className="px-4 py-3.5 font-bold text-slate-800">{destAcc ? destAcc.name : '—'}</td>
                          <td className="px-4 py-3.5 text-left font-black font-mono text-slate-900">{formatCurrency(trsf.amount, true)}</td>
                          <td className="px-4 py-3.5 text-center font-bold text-slate-600">{trsf.paymentInstrument}</td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${trsf.status === 'Executed' || trsf.status === 'Posted' ? 'bg-emerald-100 text-emerald-800' : trsf.status === 'Pending Approval' ? 'bg-amber-100 text-amber-800' : trsf.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'}`}>
                              {trsf.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button 
                              onClick={() => setSelectedTransferForLifecycle(trsf)}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 rounded text-[10px] font-bold"
                            >
                              إدارة مسار التحويل
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {transfers.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                          لا توجد عمليات تحويل بينية مسجلة حتى الآن.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
           TAB 4: CASH COUNT & PHYSICAL DENOMINATION AUDIT
           ========================================================================= */}
        {activeTab === 'cash-count' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Denomination Input Table */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Coins className="w-5 h-5 text-amber-500" />
                      محضر جرد النقدية ومطابقة الفئات الورقية
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">أدخل أعداد الفئات النقدية المتوفرة بالصندوق لمطابقتها آلياً مع الرصيد الدفتري</p>
                  </div>

                  <div>
                    <select 
                      value={selectedChestForCount}
                      onChange={(e) => setSelectedChestForCount(e.target.value)}
                      className="bg-transparent rounded-lg p-2 text-xs font-bold focus:focus:outline-none"
                    >
                      <option value="">اختر الخزينة للجرد...</option>
                      {accounts.filter(a => a.type !== 'Bank Account').map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedChestAccount ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { denom: '50', label: 'فئة 50 د.ل' },
                        { denom: '20', label: 'فئة 20 د.ل' },
                        { denom: '10', label: 'فئة 10 د.ل' },
                        { denom: '5', label: 'فئة 5 د.ل' },
                        { denom: '1', label: 'فئة 1 د.ل' },
                        { denom: '0.5', label: 'فئة 500 درهم' },
                        { denom: '0.25', label: 'فئة 250 درهم' }
                      ].map(item => (
                        <div key={item.denom} className="bg-transparent p-3 border border-slate-200">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">{item.label}</label>
                          <input 
                            type="number"
                            min={0}
                            value={denominationCounts[item.denom] || ''}
                            onChange={(e) => setDenominationCounts({ ...denominationCounts, [item.denom]: parseInt(e.target.value) || 0 })}
                            placeholder="0 قطعة"
                            className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                            المجموع: {formatCurrency(parseFloat(item.denom) * (denominationCounts[item.denom] || 0))}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-4 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-amber-800 block">إجمالي النقدية المجلودة فعلياً:</span>
                        <span className="text-2xl font-black text-amber-900 font-mono mt-0.5 block">{formatCurrency(totalCountedCash, true)}</span>
                      </div>
                      <button 
                        onClick={handleConfirmCashAudit}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
                      >
                        اعتماد محضر الجرد وتسوية الفروقات 💾
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs bg-transparent border-dashed">
                    يرجى اختيار صندوق النقدية لبدء عملية إدخال فئات الجرد النقدي.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Discrepancy Summary */}
            <div className="space-y-4">
              <div className="p-5 space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <h4 className="font-extrabold text-slate-900 text-xs border-b border-slate-200 pb-2">نتائج الجرد والمطابقة الآلية</h4>
                
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center p-2.5 bg-transparent rounded-lg">
                    <span className="text-slate-600">الرصيد الدفتري بالنظام:</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(chestBookBalance, true)}</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-transparent rounded-lg">
                    <span className="text-slate-600">الرصيد الفعلي المجلود:</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(totalCountedCash, true)}</span>
                  </div>

                  <div className={`flex justify-between items-center p-3 border ${cashDiscrepancy === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : cashDiscrepancy > 0 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                    <span className="font-bold">حالة المطابقة والفارق:</span>
                    <span className="font-mono font-black text-sm">
                      {cashDiscrepancy === 0 ? 'مطابقة تامّة (0.00)' : cashDiscrepancy > 0 ? `زيادة جرد (+${formatCurrency(cashDiscrepancy)})` : `عجز جرد (${formatCurrency(cashDiscrepancy)})`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
           TAB 5: BANK RECONCILIATION & STATEMENTS
           ========================================================================= */}
        {activeTab === 'bank-reconciliation' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Scale className="w-5 h-5 text-teal-600" />
                      التسويات والمطابقات البنكية المركزية (Bank Reconciliation)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">مطابقة حركات كشف الحساب البنكي الخارجي مع دفتر الأستاذ المعني بالنظام</p>
                  </div>

                  <select 
                    value={selectedBankForRecon}
                    onChange={(e) => setSelectedBankForRecon(e.target.value)}
                    className="bg-transparent rounded-lg p-2 text-xs font-bold focus:focus:outline-none"
                  >
                    <option value="">اختر الحساب البنكي...</option>
                    {accounts.filter(a => a.type === 'Bank Account').map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                    ))}
                  </select>
                </div>

                {selectedBankAccount ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 bg-transparent p-4 border border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ كشف البنك الخارجي:</label>
                        <input 
                          type="date"
                          value={bankStatementDate}
                          onChange={(e) => setBankStatementDate(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">الرصيد النهائي البنكي الخارجي:</label>
                        <input 
                          type="number"
                          step="any"
                          value={bankStatementEndingBalance || ''}
                          onChange={(e) => setBankStatementEndingBalance(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    <h4 className="font-extrabold text-slate-800 text-xs">قائمة المعاملات البنكية للمطابقة والتسوية:</h4>
                    
                    <div className="overflow-hidden max-h-80 overflow-y-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                          <tr>
                            <th className="px-3 py-2 text-center">مطابق (Cleared)</th>
                            <th className="px-3 py-2">المعاملة والبيان</th>
                            <th className="px-3 py-2">النوع</th>
                            <th className="px-3 py-2 text-left">المبلغ</th>
                            <th className="px-3 py-2 text-center">الحالة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                          {bankTxs.map(tx => (
                            <tr key={tx.id} className="hover:bg-transparent">
                              <td className="px-3 py-2 text-center">
                                <input 
                                  type="checkbox"
                                  checked={clearedTxIds.includes(tx.id) || tx.status === 'Reconciled'}
                                  onChange={() => toggleClearedTx(tx.id)}
                                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <div className="font-bold text-slate-800 font-mono">{tx.id}</div>
                                <div className="text-[10px] text-slate-400">{tx.description}</div>
                              </td>
                              <td className="px-3 py-2 font-bold">
                                {tx.type === 'Deposit' ? 'إيداع' : 'سحب/شيك'}
                              </td>
                              <td className="px-3 py-2 text-left font-bold font-mono">{formatCurrency(tx.amount, true)}</td>
                              <td className="px-3 py-2 text-center">
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100">{tx.status}</span>
                              </td>
                            </tr>
                          ))}

                          {bankTxs.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-400 text-xs">
                                لا توجد حركات بنكية مسجلة لهذا الحساب حالياً.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs bg-transparent border-dashed">
                    يرجى اختيار الحساب البنكي لعرض كشف الحساب والبدء بالمطابقة والتسوية.
                  </div>
                )}
              </div>
            </div>

            {/* Reconciliation Summary Card */}
            <div className="space-y-4">
              <div className="p-5 space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <h4 className="font-extrabold text-slate-900 text-xs border-b border-slate-200 pb-2">خلاصة مذكرة التسوية البنكية</h4>
                
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>رصيد الحساب البنكي بالنظام:</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(selectedBankAccount ? selectedBankAccount.balance : 0, true)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>+ إيداعات قيد التحصيل والطريق:</span>
                    <span className="font-mono font-bold text-emerald-600">{formatCurrency(unclearedDeposits, true)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>- شيكات وسحوبات لم تقدم للصرف:</span>
                    <span className="font-mono font-bold text-rose-600">{formatCurrency(unpresentedChecks, true)}</span>
                  </div>

                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center font-bold text-slate-900">
                    <span>الرصيد الدفتري المعدّل:</span>
                    <span className="font-mono font-black">{formatCurrency(adjustedBookBalance, true)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>رصيد كشف البنك الخارجي:</span>
                    <span className="font-mono font-bold text-amber-600">{formatCurrency(bankStatementEndingBalance, true)}</span>
                  </div>

                  <div className={`p-3 border flex justify-between items-center ${reconciliationDifference === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                    <span className="font-bold">فارق المطابقة:</span>
                    <span className="font-mono font-black">{formatCurrency(reconciliationDifference, true)}</span>
                  </div>
                </div>

                <button 
                  onClick={handleFinalizeBankReconciliation}
                  disabled={!selectedBankAccount}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer"
                >
                  اعتماد قيد مذكرة التسوية البنكية 🔒
                </button>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
           TAB 6: PAYMENT INSTRUMENTS CONFIG
           ========================================================================= */}
        {activeTab === 'instruments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instruments.map(inst => (
              <div key={inst.instrument} className="p-5 relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">قنوات المقبوضات والدفع</span>
                    <h4 className="font-extrabold text-slate-900 mt-1 text-sm">{inst.instrument}</h4>
                    <p className="text-xs text-slate-500 mt-1">{inst.notes || 'مفعّلة ومتوافقة مع نظام الخزينة الموحد.'}</p>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inst.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {inst.isActive ? 'نشط ومفعّل' : 'معطل مؤقتاً'}
                  </span>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-3 flex justify-end">
                  <button 
                    onClick={() => handleToggleInstrument(inst.instrument, inst.isActive)}
                    className={`font-bold text-[10px] px-3 py-1.5 rounded-lg cursor-pointer ${inst.isActive ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                  >
                    {inst.isActive ? 'تعطيل القناة 🛑' : 'تفعيل القناة ✓'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* =========================================================================
           TAB 7: AUDIT TRAIL & SECURITY GOVERNANCE
           ========================================================================= */}
        {activeTab === 'audit-trail' && (
          <div className="p-6 space-y-4 bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-rose-600" />
                  <span>سجل التدقيق والنزاهة المالية الصارمة (Audit Trail Log)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">تسجيل زمني كامل لكافة الحركات والتأدية والتحويلات المالية بالخزائن والبنوك</p>
              </div>

              <span className="bg-slate-100 text-slate-700 font-mono text-xs font-bold px-3 py-1 rounded-full">
                إجمالي السجلات: {auditLogs.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold">
                  <tr>
                    <th className="px-3 py-2.5">التاريخ والوقت</th>
                    <th className="px-3 py-2.5">المستخدم</th>
                    <th className="px-3 py-2.5">النوع / الإجراء</th>
                    <th className="px-3 py-2.5">التفاصيل والوصف</th>
                    <th className="px-3 py-2.5 text-left">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 bg-white/60 backdrop-blur-sm rounded-b-2xl">
                  {auditLogs.slice(0, 30).map(log => (
                    <tr key={log.id} className="hover:bg-transparent">
                      <td className="px-3 py-2 text-slate-500">{new Date(log.timestamp).toLocaleString('ar-LY')}</td>
                      <td className="px-3 py-2 font-bold text-slate-800">{log.userName} ({log.userRole})</td>
                      <td className="px-3 py-2">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700">{log.action}</span>
                      </td>
                      <td className="px-3 py-2 font-sans text-slate-700">{log.details}</td>
                      <td className="px-3 py-2 text-left text-slate-400">{log.ipAddress}</td>
                    </tr>
                  ))}

                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 text-xs font-sans">
                        لا توجد سجلات تدقيق مخزنة حالياً في وحدة الخزينة.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
         MODAL: ADD TREASURY ACCOUNT
         ========================================================================= */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md overflow-hidden text-right bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
            <div className="bg-[#2a1d13] text-[#fce79a] px-6 py-4 flex justify-between items-center">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                <Wallet className="text-yellow-400 w-5 h-5" />
                تسجيل صندوق نقدية أو حساب بنكي جديد
              </h3>
              <button onClick={() => setShowAddAccountModal(false)} className="text-slate-400 hover:text-white font-extrabold text-lg">×</button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الحساب/الصندوق (عربي):</label>
                <input 
                  type="text" 
                  required
                  value={newAccountForm.name}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, name: e.target.value })}
                  placeholder="مثال: خزينة الإدارة الرئيسية، حساب المصرف التجاري"
                  className="w-full bg-transparent rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الرمز الفريد (Code):</label>
                  <input 
                    type="text" 
                    required
                    value={newAccountForm.code}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, code: e.target.value })}
                    placeholder="CH-MAIN-01"
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">نوع الحساب:</label>
                  <select 
                    value={newAccountForm.type}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, type: e.target.value as any })}
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none font-bold"
                  >
                    <option value="Main Chest">صندوق رئيسي (Main Chest)</option>
                    <option value="Branch Chest">صندوق فرعي (Branch Chest)</option>
                    <option value="Bank Account">حساب بنكي جاري (Bank Account)</option>
                    <option value="Virtual Chest">خزنة افتراضية (Virtual Chest)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ربط دفتر الأستاذ (GL Account):</label>
                  <input 
                    type="text" 
                    required
                    value={newAccountForm.glAccountId}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, glAccountId: e.target.value })}
                    placeholder="acc_111"
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">العملة:</label>
                  <input 
                    type="text" 
                    required
                    value={newAccountForm.currency}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, currency: e.target.value })}
                    placeholder="LYD"
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={newAccountForm.allowNegativeBalance}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, allowNegativeBalance: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-[#c58a22] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  <span className="mr-3 text-slate-700 font-bold">السماح بالسحب المكشوف</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg cursor-pointer">حفظ وتسجيل 💾</button>
                <button type="button" onClick={() => setShowAddAccountModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL: RECEIPT VOUCHER (سند قبض)
         ========================================================================= */}
      {showReceiptVoucherModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg overflow-hidden text-right bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
            <div className="bg-emerald-800 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-emerald-300" />
                إنشاء سند قبض نقدية / بنكي رسمي (Deposit Voucher)
              </h3>
              <button onClick={() => setShowReceiptVoucherModal(false)} className="text-slate-400 hover:text-white font-extrabold text-lg">×</button>
            </div>

            <form onSubmit={handleCreateReceiptVoucher} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">استلمنا من السيد / الجهة:</label>
                  <input 
                    type="text" 
                    required
                    value={receiptVoucherForm.payerName}
                    onChange={(e) => setReceiptVoucherForm({ ...receiptVoucherForm, payerName: e.target.value })}
                    placeholder="اسم ولي الأمر / الطالب / الجهة..."
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">تصنيف الإيراد / المقبوضات:</label>
                  <select 
                    value={receiptVoucherForm.category}
                    onChange={(e) => setReceiptVoucherForm({ ...receiptVoucherForm, category: e.target.value })}
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs font-bold focus:outline-none"
                  >
                    <option value="رسوم دراسية">رسوم دراسية ورسوم التسجيل</option>
                    <option value="رسوم نقل ومواصلات">رسوم مواصلات ونقل مدرسي</option>
                    <option value="مبيعات كتب وزي">مبيعات الكتب المدرسية والزي</option>
                    <option value="إيرادات متنوعة">إيرادات أنشطة ومتنوعة</option>
                    <option value="تأمين وودائع">ودائع وتأمينات مستردة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">إيداع في حساب الخزينة/البنك:</label>
                  <select 
                    required
                    value={receiptVoucherForm.destinationAccountId}
                    onChange={(e) => setReceiptVoucherForm({ ...receiptVoucherForm, destinationAccountId: e.target.value })}
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs font-bold focus:outline-none"
                  >
                    <option value="">اختر حساب الإيداع...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المبلغ المطلوب قبضه:</label>
                  <input 
                    type="number" 
                    required
                    min={0.01}
                    step="any"
                    value={receiptVoucherForm.amount || ''}
                    onChange={(e) => setReceiptVoucherForm({ ...receiptVoucherForm, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs font-bold font-mono text-emerald-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">وسيلة الدفع:</label>
                  <select 
                    value={receiptVoucherForm.paymentInstrument}
                    onChange={(e) => setReceiptVoucherForm({ ...receiptVoucherForm, paymentInstrument: e.target.value as any })}
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs font-bold focus:outline-none"
                  >
                    {instruments.map(i => (
                      <option key={i.instrument} value={i.instrument}>{i.instrument}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بيانات الإيداع / الشيك / POS:</label>
                  <input 
                    type="text" 
                    value={receiptVoucherForm.paymentInstrumentDetails}
                    onChange={(e) => setReceiptVoucherForm({ ...receiptVoucherForm, paymentInstrumentDetails: e.target.value })}
                    placeholder="رقم شيك، إيصال سداد..."
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">وذلك عن (البيان التفصيلي):</label>
                <textarea 
                  rows={2}
                  required
                  value={receiptVoucherForm.description}
                  onChange={(e) => setReceiptVoucherForm({ ...receiptVoucherForm, description: e.target.value })}
                  placeholder="سداد القسط الأول عن العام الدراسي 2026/2027..."
                  className="w-full bg-transparent rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg cursor-pointer">حفظ وتقييد سند القبض 💾</button>
                <button type="button" onClick={() => setShowReceiptVoucherModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL: DISBURSEMENT VOUCHER (سند صرف)
         ========================================================================= */}
      {showDisbursementVoucherModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg overflow-hidden text-right bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
            <div className="bg-rose-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-rose-300" />
                إنشاء سند صرف نقدية / بنكي رسمي (Payment Voucher)
              </h3>
              <button onClick={() => setShowDisbursementVoucherModal(false)} className="text-slate-400 hover:text-white font-extrabold text-lg">×</button>
            </div>

            <form onSubmit={handleCreateDisbursementVoucher} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">يدفع للسيد / الجهة المستفيدة:</label>
                  <input 
                    type="text" 
                    required
                    value={disbursementVoucherForm.beneficiaryName}
                    onChange={(e) => setDisbursementVoucherForm({ ...disbursementVoucherForm, beneficiaryName: e.target.value })}
                    placeholder="اسم المورد / الموظف / المستفيد..."
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">تصنيف المصروف / النفقات:</label>
                  <select 
                    value={disbursementVoucherForm.category}
                    onChange={(e) => setDisbursementVoucherForm({ ...disbursementVoucherForm, category: e.target.value })}
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs font-bold focus:outline-none"
                  >
                    <option value="مصروفات تشغيلية">مصروفات تشغيلية وصيانة</option>
                    <option value="سداد موردين">سداد مستحقات موردين وقرطاسية</option>
                    <option value="عهد موظفين">عهد نقدية مؤقتة لموظفين</option>
                    <option value="رواتب وأجور">صرف رواتب ومكافآت</option>
                    <option value="استرداد رسوم">استرداد رسوم طلابية</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">صرف من حساب الخزينة/البنك:</label>
                  <select 
                    required
                    value={disbursementVoucherForm.sourceAccountId}
                    onChange={(e) => setDisbursementVoucherForm({ ...disbursementVoucherForm, sourceAccountId: e.target.value })}
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs font-bold focus:outline-none"
                  >
                    <option value="">اختر حساب الصرف...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المبلغ المراد صرفه:</label>
                  <input 
                    type="number" 
                    required
                    min={0.01}
                    step="any"
                    value={disbursementVoucherForm.amount || ''}
                    onChange={(e) => setDisbursementVoucherForm({ ...disbursementVoucherForm, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs font-bold font-mono text-rose-800 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">وسيلة الصرف:</label>
                  <select 
                    value={disbursementVoucherForm.paymentInstrument}
                    onChange={(e) => setDisbursementVoucherForm({ ...disbursementVoucherForm, paymentInstrument: e.target.value as any })}
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs font-bold focus:outline-none"
                  >
                    {instruments.map(i => (
                      <option key={i.instrument} value={i.instrument}>{i.instrument}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">تفاصيل الشيك / التحويل:</label>
                  <input 
                    type="text" 
                    value={disbursementVoucherForm.paymentInstrumentDetails}
                    onChange={(e) => setDisbursementVoucherForm({ ...disbursementVoucherForm, paymentInstrumentDetails: e.target.value })}
                    placeholder="رقم شيك، مرجع البنك..."
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">وذلك عن (البيان التفصيلي):</label>
                <textarea 
                  rows={2}
                  required
                  value={disbursementVoucherForm.description}
                  onChange={(e) => setDisbursementVoucherForm({ ...disbursementVoucherForm, description: e.target.value })}
                  placeholder="سداد فاتورة توريد مستلزمات مكتبية وصيانة..."
                  className="w-full bg-transparent rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="submit" className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-4 py-2 rounded-lg cursor-pointer">حفظ وتقييد سند الصرف 💾</button>
                <button type="button" onClick={() => setShowDisbursementVoucherModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL: INTER-CHEST & BANK TRANSFER CREATOR
         ========================================================================= */}
      {showAddTransferModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg overflow-hidden text-right bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
            <div className="bg-amber-950 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                <ArrowRightLeft className="text-yellow-400 w-5 h-5 animate-pulse" />
                طلب تحويل مالي بيني (Inter-Chest Transfer)
              </h3>
              <button onClick={() => setShowAddTransferModal(false)} className="text-slate-400 hover:text-white font-extrabold text-lg">×</button>
            </div>

            <form onSubmit={handleCreateTransfer} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">من حساب الخزينة/البنك (المصدر):</label>
                  <select 
                    required
                    value={transferForm.sourceAccountId}
                    onChange={(e) => setTransferForm({ ...transferForm, sourceAccountId: e.target.value })}
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs font-bold focus:outline-none"
                  >
                    <option value="">اختر حساب الخروج...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">إلى حساب الخزينة/البنك (المستهدف):</label>
                  <select 
                    required
                    value={transferForm.destinationAccountId}
                    onChange={(e) => setTransferForm({ ...transferForm, destinationAccountId: e.target.value })}
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs font-bold focus:outline-none"
                  >
                    <option value="">اختر حساب الدخول...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">مبلغ التحويل البيني:</label>
                  <input 
                    type="number" 
                    required
                    min={0.01}
                    step="any"
                    value={transferForm.amount || ''}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs font-bold font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">وسيلة التحويل:</label>
                  <select 
                    value={transferForm.paymentInstrument}
                    onChange={(e) => setTransferForm({ ...transferForm, paymentInstrument: e.target.value as any })}
                    className="w-full bg-transparent rounded-lg p-2.5 text-xs font-bold focus:outline-none"
                  >
                    {instruments.map(i => (
                      <option key={i.instrument} value={i.instrument}>{i.instrument}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">سبب الوصف والتحويل:</label>
                <input 
                  type="text" 
                  required
                  value={transferForm.description}
                  onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                  placeholder="تغذية الخزينة الفرعية من الصندوق الرئيسي..."
                  className="w-full bg-transparent rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="submit" className="bg-[#c58a22] hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer">حفظ طلب التحويل 💾</button>
                <button type="button" onClick={() => setShowAddTransferModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL: PRINT OFFICIAL VOUCHER RECEIPT
         ========================================================================= */}
      {selectedVoucherForPrint && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden text-right my-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
            
            {/* Action Bar inside Print Preview Modal */}
            <div className="bg-[#2a1d13] text-[#fce79a] px-6 py-4 flex justify-between items-center no-print">
              <span className="font-extrabold text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-yellow-400" />
                معاينة وطباعة سند رسمي معتمد
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة المستند</span>
                </button>
                <button 
                  onClick={() => setSelectedVoucherForPrint(null)}
                  className="text-slate-400 hover:text-white font-extrabold text-xl px-2"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Printable Voucher Paper View */}
            <div className="p-8 space-y-6 text-slate-900 border-4 border-slate-100 m-2 rounded-xl" id="printable-voucher">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div className="text-right">
                  <h2 className="text-lg font-black text-slate-900">{selectedSchool.name}</h2>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">الإدارة المالية - قسم الخزينة والمدفوعات</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">الرقم المالي الموحد: {selectedSchool.id}</p>
                </div>
                <div className="text-left border-r-2 border-slate-200 pr-6">
                  <div className={`px-3 py-1 rounded-lg text-sm font-black text-white ${selectedVoucherForPrint.type === 'Deposit' ? 'bg-emerald-700' : 'bg-rose-700'}`}>
                    {selectedVoucherForPrint.type === 'Deposit' ? 'سند قبض رسمي (RECEIPT VOUCHER)' : 'سند صرف رسمي (PAYMENT VOUCHER)'}
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-2">رقم المستند: {selectedVoucherForPrint.id}</p>
                  <p className="text-xs text-slate-500 font-mono">التاريخ: {new Date(selectedVoucherForPrint.createdAt).toLocaleDateString('ar-LY')}</p>
                </div>
              </div>

              {/* Amount Box */}
              <div className="bg-transparent border-2 border-slate-200 p-4 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-500 font-bold block">المبلغ بالأرقام:</span>
                  <span className="text-2xl font-black font-mono text-slate-900 mt-0.5 block">{formatCurrency(selectedVoucherForPrint.amount, true)}</span>
                </div>
                <div className="text-left">
                  <span className="text-xs text-slate-500 font-bold block">المبلغ بالحروف:</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block px-3 py-1 rounded-lg">
                    {numberToArabicWords(selectedVoucherForPrint.amount)}
                  </span>
                </div>
              </div>

              {/* Receipt Details Body */}
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="flex border-b border-slate-100 pb-2">
                  <span className="w-32 text-slate-500 font-bold">{selectedVoucherForPrint.type === 'Deposit' ? 'استلمنا من السيد / الجهة:' : 'دفعنا للسيد / الجهة:'}</span>
                  <span className="font-extrabold text-slate-900 border-b border-slate-300 flex-1 px-2">{selectedVoucherForPrint.description.split('-')[0] || 'المستفيد المعين'}</span>
                </div>

                <div className="flex border-b border-slate-100 pb-2">
                  <span className="w-32 text-slate-500 font-bold">وسيلة الدفع والقناة:</span>
                  <span className="font-bold text-slate-900 flex-1 px-2">{selectedVoucherForPrint.paymentInstrument} {selectedVoucherForPrint.paymentInstrumentDetails ? `(${selectedVoucherForPrint.paymentInstrumentDetails})` : ''}</span>
                </div>

                <div className="flex border-b border-slate-100 pb-2">
                  <span className="w-32 text-slate-500 font-bold">البيان والتفاصيل:</span>
                  <span className="font-medium text-slate-800 flex-1 px-2">{selectedVoucherForPrint.description}</span>
                </div>
              </div>

              {/* Official Signatures Block */}
              <div className="pt-8 border-t-2 border-slate-200 grid grid-cols-4 gap-4 text-center text-[10px] font-bold">
                <div className="space-y-6">
                  <p className="text-slate-500">أمين الصندوق / المحرر</p>
                  <p className="border-b border-slate-300 pb-1 font-mono text-slate-800">{selectedVoucherForPrint.preparedBy || 'المحرر المعتمد'}</p>
                </div>
                <div className="space-y-6">
                  <p className="text-slate-500">التفتيش والمراجعة</p>
                  <p className="border-b border-slate-300 pb-1 text-slate-400">........................</p>
                </div>
                <div className="space-y-6">
                  <p className="text-slate-500">اعتماد المدير المالي</p>
                  <p className="border-b border-slate-300 pb-1 text-slate-400">........................</p>
                </div>
                <div className="space-y-6">
                  <p className="text-slate-500">توقيع المستلم / الدافع</p>
                  <p className="border-b border-slate-300 pb-1 text-slate-400">........................</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL: TRANSACTION LIFECYCLE MANAGEMENT
         ========================================================================= */}
      {selectedTxForLifecycle && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="shadow-2xl w-full max-w-xl overflow-hidden text-right bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
            <div className="bg-[#2a1d13] text-[#fce79a] px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm">التحكم في المسار المستندي للمعاملة المالية</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">رقم المعاملة: {selectedTxForLifecycle.id}</p>
              </div>
              <button onClick={() => setSelectedTxForLifecycle(null)} className="text-slate-400 hover:text-white font-extrabold text-lg">×</button>
            </div>

            <div className="p-6 space-y-6 text-xs">
              <div className="bg-transparent rounded-lg p-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">نوع المستند:</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedTxForLifecycle.type === 'Deposit' ? 'سند قبض' : 'سند صرف'}</p>
                </div>
                <div>
                  <span className="text-slate-400">المبلغ والعملة:</span>
                  <p className="font-extrabold text-slate-800 text-sm mt-0.5 font-mono">{formatCurrency(selectedTxForLifecycle.amount, true)}</p>
                </div>
                <div>
                  <span className="text-slate-400">الحالة المستندية الحالية:</span>
                  <p className="mt-0.5">
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200 text-[10px]">
                      {selectedTxForLifecycle.status}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">وسيلة الدفع:</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedTxForLifecycle.paymentInstrument}</p>
                </div>
              </div>

              {/* State Transitions */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1">ترقية وتوجيه المعاملة عبر المسار المستندي:</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  
                  {selectedTxForLifecycle.status === 'Draft' && (
                    <button 
                      onClick={() => handleLifecycleTransition(selectedTxForLifecycle.id, 'Pending Approval')}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold p-3 rounded-lg text-right flex justify-between items-center cursor-pointer"
                    >
                      <span>1. التقديم للمراجعة والاعتماد</span>
                      <span className="bg-amber-500/20 px-2 py-0.5 rounded text-[9px]">Pending Approval</span>
                    </button>
                  )}

                  {selectedTxForLifecycle.status === 'Pending Approval' && (
                    <>
                      <button 
                        onClick={() => handleLifecycleTransition(selectedTxForLifecycle.id, 'Approved')}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold p-3 rounded-lg text-right flex justify-between items-center cursor-pointer"
                      >
                        <span>2. اعتماد وموافقة المسؤول</span>
                        <span className="bg-orange-500/20 px-2 py-0.5 rounded text-[9px]">Approved</span>
                      </button>
                      <button 
                        onClick={() => handleLifecycleTransition(selectedTxForLifecycle.id, 'Draft')}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold p-3 rounded-lg text-right flex justify-between items-center cursor-pointer"
                      >
                        <span>إرجاع مسودة للتعديل</span>
                        <span>Draft</span>
                      </button>
                    </>
                  )}

                  {selectedTxForLifecycle.status === 'Approved' && (
                    <button 
                      onClick={() => handleLifecycleTransition(selectedTxForLifecycle.id, 'Executed')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-lg text-right flex justify-between items-center cursor-pointer"
                    >
                      <div>
                        <span className="block">3. التنفيذ الفعلي للنقدية</span>
                        <span className="text-[9px] text-emerald-100 block mt-0.5">تحديث رصيد الخزينة فوراً</span>
                      </div>
                      <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-[9px]">Executed</span>
                    </button>
                  )}

                  {selectedTxForLifecycle.status === 'Executed' && (
                    <button 
                      onClick={() => handleLifecycleTransition(selectedTxForLifecycle.id, 'Posted')}
                      className="bg-[#c58a22] hover:bg-amber-700 text-white font-bold p-3 rounded-lg text-right flex justify-between items-center cursor-pointer"
                    >
                      <div>
                        <span className="block">4. الترحيل للأستاذ العام (GL)</span>
                        <span className="text-[9px] text-amber-100 block mt-0.5">توليد القيد المحاسبي آلياً</span>
                      </div>
                      <span className="bg-amber-500/20 px-2 py-0.5 rounded text-[9px]">Posted</span>
                    </button>
                  )}

                  {selectedTxForLifecycle.status === 'Posted' && (
                    <button 
                      onClick={() => handleLifecycleTransition(selectedTxForLifecycle.id, 'Reconciled')}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold p-3 rounded-lg text-right flex justify-between items-center cursor-pointer"
                    >
                      <div>
                        <span className="block">5. المطابقة البنكية</span>
                        <span className="text-[9px] text-teal-100 block mt-0.5">مطابقة الحركة مع كشف البنك</span>
                      </div>
                      <span className="bg-teal-500/20 px-2 py-0.5 rounded text-[9px]">Reconciled</span>
                    </button>
                  )}

                  {['Draft', 'Pending Approval', 'Approved', 'Executed'].includes(selectedTxForLifecycle.status) && (
                    <button 
                      onClick={() => handleLifecycleTransition(selectedTxForLifecycle.id, 'Cancelled')}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold p-3 rounded-lg text-right flex justify-between items-center cursor-pointer"
                    >
                      <span>إلغاء وإسقاط المعاملة</span>
                      <span>Cancelled</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL: TRANSFER LIFECYCLE MANAGEMENT
         ========================================================================= */}
      {selectedTransferForLifecycle && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="shadow-2xl w-full max-w-lg overflow-hidden text-right bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 rounded-3xl">
            <div className="bg-amber-950 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm">مسار اعتماد وتنفيذ التحويل المالي البيني</h3>
                <p className="text-[10px] text-amber-300 mt-0.5">رقم التحويل: {selectedTransferForLifecycle.id}</p>
              </div>
              <button onClick={() => setSelectedTransferForLifecycle(null)} className="text-slate-400 hover:text-white font-extrabold text-lg">×</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-transparent p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">المبلغ والعملة:</span>
                  <span className="font-mono font-black text-slate-900">{formatCurrency(selectedTransferForLifecycle.amount, true)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الحالة الحالية:</span>
                  <span className="font-bold text-amber-700">{selectedTransferForLifecycle.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">البيان:</span>
                  <span className="font-bold text-slate-800">{selectedTransferForLifecycle.description}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                {selectedTransferForLifecycle.status === 'Draft' && (
                  <button 
                    onClick={() => handleTransferTransition(selectedTransferForLifecycle.id, 'submit')}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold p-3 rounded-lg text-center cursor-pointer"
                  >
                    تقديم للموافقة والاعتماد (Submit for Approval)
                  </button>
                )}

                {selectedTransferForLifecycle.status === 'Pending Approval' && (
                  <button 
                    onClick={() => handleTransferTransition(selectedTransferForLifecycle.id, 'approve')}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold p-3 rounded-lg text-center cursor-pointer"
                  >
                    اعتماد أمر التحويل المالي (Approve)
                  </button>
                )}

                {(selectedTransferForLifecycle.status === 'Approved' || selectedTransferForLifecycle.status === 'Draft') && (
                  <button 
                    onClick={() => handleTransferTransition(selectedTransferForLifecycle.id, 'execute')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-lg text-center cursor-pointer"
                  >
                    تنفيذ التحويل وترحيل الأثر المالي لدفتر الأستاذ (Execute & Post)
                  </button>
                )}

                {selectedTransferForLifecycle.status !== 'Executed' && selectedTransferForLifecycle.status !== 'Posted' && (
                  <button 
                    onClick={() => handleTransferTransition(selectedTransferForLifecycle.id, 'cancel')}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold p-3 rounded-lg text-center cursor-pointer"
                  >
                    إلغاء أمر التحويل
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
