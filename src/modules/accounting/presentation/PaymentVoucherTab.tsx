import { AlertTriangle, BookOpen, Calculator, Check, CheckCircle2, ChevronLeft, ChevronRight, Coins, CornerUpLeft, CreditCard, Edit, Eye, FileDown, FileText, Filter, Hash, LayoutTemplate, Link, List, Maximize2, Minimize2, PenTool, Play, Plus, Printer, Save, Search, Settings2, Share2, ShieldAlert, Table, Trash2, Upload, User, X } from 'lucide-react';
import React from 'react';
import { AccountingContext } from '../../../components/GeneralLedgerPortal';
import { EnterpriseAuditLogger } from '../../../utils/EnterpriseAuditLogger';

const VOUCHER_STAGE_LABELS: Record<string, string> = {
  kindergarten: 'الروضة',
  primary: 'الابتدائي',
  middle: 'المتوسط',
  secondary: 'الثانوي'
};

const getVoucherStageKey = (voucher: any): string => {
  const value = String(voucher.schoolStage || voucher.stageKey || '').trim().toLowerCase();
  if (VOUCHER_STAGE_LABELS[value]) return value;
  const costCenter = String(voucher.costCenter || '').trim().toLowerCase();
  return VOUCHER_STAGE_LABELS[costCenter] ? costCenter : '';
};

const getVoucherCostCenterLabel = (voucher: any): string => {
  const stageKey = getVoucherStageKey(voucher);
  return VOUCHER_STAGE_LABELS[stageKey] || String(voucher.costCenter || 'غير محدد');
};

export const PaymentVoucherTab = () => {
  const {
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
  paymentVouchers, setPaymentVouchers, receiptVoucherForm, setReceiptVoucherForm, paymentVoucherForm, setPaymentVoucherForm,
  selectedReceiptVoucher, setSelectedReceiptVoucher,
  selectedPaymentVoucher, setSelectedPaymentVoucher,
  showReceiptDetailModal, setShowReceiptDetailModal,
  showPaymentDetailModal, setShowPaymentDetailModal,
  receiptSearch, setReceiptSearch,
  receiptCostCenterFilter, setReceiptCostCenterFilter,
  paymentSearch, setPaymentSearch,
  paymentCostCenterFilter, setPaymentCostCenterFilter,
  bankTransferForm, setBankTransferForm,
  fixedAssets, setFixedAssets, selectedAssetId, setSelectedAssetId, assetDetailTab, setAssetDetailTab,
  isAssetEditing, setIsAssetEditing, isNewAssetMode, setIsNewAssetMode,
  assetSearchQuery, setAssetSearchQuery, assetCategoryFilter, setAssetCategoryFilter,
  assetStatusFilter, setAssetStatusFilter, assetCostCenterFilter, setAssetCostCenterFilter,
  assetForm, setAssetForm, maintenanceForm, setMaintenanceForm, transferForm, setTransferForm,
  saleForm, setSaleForm, discardForm, setDiscardForm, activeAssetModal, setActiveAssetModal,
  fixedAssetReportType, setFixedAssetReportType, fixedAssetViewMode, setFixedAssetViewMode,
  budgets, setBudgets, calcExpr, setCalcExpr, calcResult, setCalcResult,
  fxAmount, setFxAmount, fxFrom, setFxFrom, fxResult, setFxResult,
  
  getNormalizedJournalEntries, handleSelectReport, handleDrillDownBreadcrumbClick,
  handleDrillDownToAccount, handleDrillDownToJournalEntry, handleDrillDownToOriginalDocument,
  hasUserPermission, exportReportExcel, handleSelectAsset, handleNewAsset, handleSaveAsset,
  handleDeleteAsset, handleRecalculateAssetDepreciation, handlePostAssetDepreciation,
  handleTransferAssetSubmit, handleSellAssetSubmit, handleDiscardAssetSubmit, handleMaintenanceSubmit,
  handleImportExcelSimulate, handleDownloadTemplate, handlePrintAssetCard, handlePrintDepreciationSchedule,
  findOriginalDocument, handleReportAccountClick, handleJournalEntryClick,
  isAccountOrDescendant, getProcessedAccounts,
  formatCurrency, triggerNotification, persistCanonicalFinancialSnapshot, canonicalFinancialStatus, canonicalFinancialWriteMode
} = React.useContext(AccountingContext);
  const ledgerPostingReady = canonicalFinancialWriteMode === 'ledger_ready' || canonicalFinancialWriteMode === 'erp_integrated';
  const snapshotWriteReady = canonicalFinancialWriteMode === 'snapshot_write';
  const canonicalWriteReady = canonicalFinancialStatus === 'ready'
    && (ledgerPostingReady || snapshotWriteReady)
    && typeof persistCanonicalFinancialSnapshot === 'function';
  const paymentSubmitLabel = ledgerPostingReady
    ? 'ترحيل سند الصرف عبر دفتر الأستاذ الكانوني 🖹'
    : snapshotWriteReady
      ? 'حفظ سند الصرف في المصدر المركزي UAT'
      : 'الترحيل غير متاح — خدمة دفتر الأستاذ غير معتمدة';

  const handleAddPaymentVoucher = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canonicalWriteReady) {
      triggerNotification('تعذر اعتماد سند الصرف: المصدر الحالي snapshot للقراءة فقط، ولم تعتمد خدمة دفتر الأستاذ الكانونية.', 'warning');
      return;
    }

    const amt = parseFloat(paymentVoucherForm.amount);
    if (isNaN(amt) || amt <= 0) {
      triggerNotification('❌ القيمة المالية المدخلة غير صالحة', 'error');
      return;
    }

    const nextIdNum = paymentVouchers.length + 1;
    const pvId = `PV-2026-${String(nextIdNum).padStart(4, '0')}`;
    const jvId = `JV-2026-PV-${String(nextIdNum).padStart(4, '0')}`;
    const creditAccountCode = paymentVoucherForm.paidFromAccount;
    const debitAccountCode = paymentVoucherForm.paidToAccount;
    if (!creditAccountCode || !debitAccountCode || !accounts.some((account: any) => account.code === creditAccountCode) || !accounts.some((account: any) => account.code === debitAccountCode)) {
      triggerNotification('تعذر اعتماد سند الصرف: يجب اختيار حساب مصدر وحساب مستفيد موثقين في شجرة الحسابات.', 'warning');
      return;
    }

    // 1. Create Payment Voucher object
    const newPv = {
      id: pvId,
      date: paymentVoucherForm.date || new Date().toISOString().split('T')[0],
      beneficiary: paymentVoucherForm.beneficiary,
      costCenter: paymentVoucherForm.costCenter || 'primary',
      paidFromAccount: paymentVoucherForm.paidFromAccount,
      paidToAccount: paymentVoucherForm.paidToAccount,
      amount: amt,
      against: paymentVoucherForm.against,
      paymentMethod: paymentVoucherForm.paymentMethod,
      attachmentName: paymentVoucherForm.attachmentName,
      notes: paymentVoucherForm.notes,
      user: 'سليمان غازي',
      status: 'معتمد',
      financialPeriod: 'السنة المالية 2026',
      createdAt: new Date().toLocaleDateString('ar-LY') + ' ' + new Date().toLocaleTimeString('ar-LY'),
      journalEntryId: jvId
    };

    // 2. Create Journal Entry object
    const newJv = {
      id: jvId,
      date: paymentVoucherForm.date || new Date().toISOString().split('T')[0],
      description: `توطين قيد سند صرف رقم ${pvId} - لصالح ${paymentVoucherForm.beneficiary}`,
      debitSum: amt,
      creditSum: amt,
      debitTotal: amt,
      creditTotal: amt,
      status: 'مرحل',
      isSystemGenerated: true,
      paymentVoucherId: pvId,
      lines: [
        {
          id: `${jvId}-1`,
          accountCode: debitAccountCode,
          accountName: accounts.find((a: any) => a.code === debitAccountCode)?.nameAr || 'حساب مصروف',
          description: `إثبات مصروف السند ${pvId}`,
          debit: amt,
          credit: 0,
          costCenter: paymentVoucherForm.costCenter
        },
        {
          id: `${jvId}-2`,
          accountCode: creditAccountCode,
          accountName: accounts.find((a: any) => a.code === creditAccountCode)?.nameAr || 'حساب صندوق/بنك',
          description: `دفع قيمة السند ${pvId}`,
          debit: 0,
          credit: amt,
          costCenter: paymentVoucherForm.costCenter
        }
      ]
    };

    // 3. Update accounts balance
    const updatedAccounts = accounts.map((acc: any) => {
      if (acc.code === creditAccountCode) {
        return { ...acc, balance: acc.balance - amt }; // For assets, credit reduces balance
      }
      if (acc.code === debitAccountCode) {
        return { ...acc, balance: acc.balance + amt }; // For expenses, debit increases balance
      }
      return acc;
    });

    const updatedPvs = [newPv, ...paymentVouchers];
    const updatedJvs = [newJv, ...journalEntries];

    // 4. Never fall back to localStorage for a financial voucher.
    try {
      await persistCanonicalFinancialSnapshot({
        paymentVouchers: updatedPvs,
        journalEntries: updatedJvs,
        chartOfAccounts: updatedAccounts
      });
    } catch (error: any) {
      triggerNotification(`تعذر حفظ سند الصرف مركزياً: ${error?.message || 'خطأ غير معروف'}`, 'warning');
      return;
    }

    setPaymentVouchers(updatedPvs);
    setJournalEntries(updatedJvs);
    setAccounts(updatedAccounts);

    // Reset Form
    setPaymentVoucherForm({
      date: new Date().toISOString().split('T')[0],
      beneficiary: 'شركة البيان للمطبوعات والكتب',
      costCenter: 'primary',
      paidFromAccount: '1101',
      paidToAccount: '5270',
      amount: '',
      against: 'مستخلص سداد دفعة توريد كتب وقرطاسية مدرسية',
      paymentMethod: 'نقدي',
      attachmentName: '',
      notes: 'خصماً من حساب الميزانية العمومية والتشغيلية المعتمدة لفرع طرابلس'
    });

    // Audit Log
    EnterpriseAuditLogger.log({
      action: 'اعتماد',
      oldValue: null,
      newValue: newPv,
      userName: 'سليمان غازي',
      userRole: 'Manager',
      module: 'الحسابات العامة',
      device: 'نظام الإدارة المالية المركزي'
    });

    triggerNotification(ledgerPostingReady
      ? `تم إنشاء وترحيل سند الصرف ${pvId} عبر خدمة دفتر الأستاذ الكانونية.`
      : `تم حفظ سند الصرف ${pvId} في المصدر المركزي UAT بإصدار موثق؛ لم يُعتمد كترحيل نهائي في دفتر الأستاذ العام.`, 'success');
  };


const handlePrintPV = (pv: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerNotification('❌ عذراً، تم حظر فتح نافذة الطباعة التلقائية بواسطة متصفحك. يرجى تفعيل النوافذ المنبثقة للرابط الحالي.', 'warning');
      return;
    }

    const accountCode = pv.paidFromAccount || '1101';
    const accountName = accountCode === '1101' ? 'صندوق النقدية والخزينة الموحدة' : 'الحساب الجاري بالمصرف';
    
    const debitAccountCode = pv.paidToAccount || '5270';
    const debitAccountName = accounts.find((a: any) => a.code === debitAccountCode)?.nameAr || 'بند المصروف المرتبط';

    const stageLabel = pv.stage || 'الابتدائي';
    const costCenterCode = pv.costCenter?.toUpperCase() || 'GENERAL';

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>سند صرف رقم ${pv.id}</title>
          <style>
            body {
              font-family: 'Inter', system-ui, sans-serif;
              padding: 40px;
              color: #000000;
              background-color: #ffffff;
              font-size: 12px;
            }
            .header-container {
              display: flex;
              justify-content: justify;
              align-items: center;
              border-bottom: 2px solid #dc2626;
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
            .voucher-meta {
              text-align: left;
              font-family: monospace;
              font-size: 10px;
              background-color: #f8fafc;
              padding: 10px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .voucher-id {
              color: #dc2626;
              font-weight: 900;
              font-size: 12px;
            }
            .title-section {
              text-align: center;
              margin: 20px 0;
              background-color: #fef2f2;
              border: 1px solid #fecaca;
              padding: 10px;
              border-radius: 8px;
            }
            .title-main {
              font-size: 16px;
              font-weight: 900;
              color: #7f1d1d;
              margin: 0 0 5px 0;
            }
            .title-sub {
              font-size: 10px;
              color: #b91c1c;
              margin: 0;
              font-weight: bold;
            }
            .info-grid {
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
            .info-item {
              font-size: 11px;
            }
            .amount-box {
              display: grid;
              grid-template-columns: 1fr 2fr;
              gap: 15px;
              align-items: center;
              margin-bottom: 25px;
            }
            .amount-val {
              background-color: #dc2626;
              color: #ffffff;
              font-weight: 900;
              font-size: 16px;
              text-align: center;
              padding: 12px;
              border-radius: 8px;
              font-family: monospace;
            }
            .amount-words {
              background-color: #f1f5f9;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 10px 15px;
              font-weight: 900;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 11px;
            }
            th {
              background-color: #f1f5f9;
              border: 1px solid #cbd5e1;
              padding: 8px;
              font-weight: bold;
            }
            td {
              border: 1px solid #cbd5e1;
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
            @media print {
              body { padding: 0; }
              @page { size: A4; margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="school-info">
              <h2 class="school-title">مجموعة مدارس الأسرة الحديثة التعليمية</h2>
              <p class="school-subtitle">فرع طرابلس الرئيسي - ترخيص وزارة التعليم رقم (٢٢١ / ٢٠٢٤)</p>
              <p class="school-meta">الرقم الضريبي الموحد: 400182811 | طرابلس، ليبيا</p>
            </div>
            <div class="voucher-meta">
              <div class="voucher-id">سند صرف رقم: ${pv.id}</div>
              <div style="margin-top: 5px;">التاريخ: ${pv.date}</div>
            </div>
          </div>

          <div class="title-section">
            <h1 class="title-main">سند صرف مالي رسمي ومستند تغطية نفقات</h1>
            <p class="title-sub">صادر بنظام الربط والقيد المزدوج التلقائي الموحد</p>
          </div>

          <div class="info-grid">
            <div class="info-item"><b>المدرسة الدافعة:</b> <span>${pv.school || 'مدرسة الأسرة الحديثة'}</span></div>
            <div class="info-item"><b>المرحلة التعليمية ومركز التكلفة:</b> <span style="color: #b91c1c; font-weight: bold;">${stageLabel} (مركز: CC_${costCenterCode})</span></div>
            <div class="info-item" style="grid-column: span 2; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 5px;">
              <b>صرفنا إلى السيد / الجهة المستفيدة:</b>
              <div style="font-weight: bold; font-size: 12px; background-color: #ffffff; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; margin-top: 5px;">
                ${pv.beneficiary}
              </div>
            </div>
            <div class="info-item" style="grid-column: span 2; border-top: 1px solid #e2e8f0; padding-top: 10px;">
              <b>وذلك لقاء (بيان وتحليل الصرف المعزز):</b>
              <span style="font-weight: bold;">${pv.against}</span>
            </div>
          </div>

          <div class="amount-box">
            <div class="amount-val">${pv.amount?.toLocaleString()} د.ل</div>
            <div class="amount-words">
              <span style="font-size: 9px; color: #64748b; display: block; font-weight: normal; margin-bottom: 2px;">التفقيط المالي الرسمي (الأبجدي):</span>
              فقط مبلغه ${pv.amount?.toLocaleString()} دينار ليبي لا غير.
            </div>
          </div>

          <h4 style="font-size: 11px; font-weight: 900; margin: 0 0 8px 0; color: #1e293b;">الربط المحاسبي التلقائي بنظام القيد المزدوج المتوازن (الصرف)</h4>
          <table>
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="width: 20%;">رقم الحساب</th>
                <th style="width: 40%;">اسم البند في شجرة الحسابات</th>
                <th style="width: 20%; text-align: center;">الجانب المدين</th>
                <th style="width: 20%; text-align: center;">الجانب الدائن</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-family: monospace; color: #4338ca; font-weight: bold;">${debitAccountCode}</td>
                <td>${debitAccountName}</td>
                <td style="text-align: center; font-family: monospace; color: #059669; font-weight: bold;">${pv.amount?.toLocaleString()} د.ل</td>
                <td style="text-align: center; font-family: monospace; color: #94a3b8;">0.00</td>
              </tr>
              <tr>
                <td style="font-family: monospace; color: #4338ca; font-weight: bold;">${accountCode}</td>
                <td>${accountName}</td>
                <td style="text-align: center; font-family: monospace; color: #94a3b8;">0.00</td>
                <td style="text-align: center; font-family: monospace; color: #dc2626; font-weight: bold;">${pv.amount?.toLocaleString()} د.ل</td>
              </tr>
            </tbody>
          </table>

          <div class="signatures-grid">
            <div class="signature-box">
              <div class="signature-title">المستلم (المورد/الجهة)</div>
              <div style="font-family: monospace; font-size: 10px; color: #475569;">(توقيع المستفيد بالاستلام)</div>
            </div>
            <div class="signature-box">
              <div class="signature-title">المحاسب المالي للفرع</div>
              <div style="font-size: 9px; color: #94a3b8; font-style: italic;">(توقيع إلكتروني مؤمن)</div>
            </div>
            <div class="signature-box">
              <div class="signature-title">المدير المالي المعتمد</div>
              <div style="font-size: 9px; color: #94a3b8; font-style: italic;">(توقيع واعتماد نهائي)</div>
            </div>
          </div>

          <p style="text-align: center; font-size: 9px; color: #94a3b8; margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
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
    triggerNotification('🖨️ تم توجيه السند لأمر الطباعة والنافذة المنبثقة بنجاح', 'success');
  };


  return (
    <>
              {activeTab === 'payment_voucher' && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900">منظومة سندات الصرف والمستخلصات</h2>
                <p className="text-xs text-slate-500 mt-1">صرف رواتب الكوادر، نفقات المياه والطاقة، والصيانات الدورية بموافقة المدير المالي</p>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-2 px-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="font-extrabold text-rose-800 text-[10px]">المطابقة والموازنة: مفعلة وتدقيق صارم</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Side: Create Payment Form */}
              <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-4 text-rose-700 pb-3 border-b border-slate-100">
                  <Coins className="w-5 h-5 text-rose-600" />
                  <span className="font-black text-sm">إنشاء سند صرف مالي جديد</span>
                  <span className="mr-auto font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                    السند التالي: PV-2026-{String(paymentVouchers.length + 1).padStart(4, '0')}
                  </span>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleAddPaymentVoucher(e); }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">الجهة المستفيدة (المستلم للمال):</label>
                      <input 
                        type="text" 
                        required
                        value={paymentVoucherForm.beneficiary}
                        onChange={(e) => setPaymentVoucherForm(prev => ({ ...prev, beneficiary: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                        placeholder="اسم المورد، الموظف، أو شركة الصيانة"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">تاريخ الصرف:</label>
                      <input 
                        type="date" 
                        required
                        value={paymentVoucherForm.date}
                        onChange={(e) => setPaymentVoucherForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">مركز التكلفة المسؤول عن المصروف:</label>
                      <select 
                        value={paymentVoucherForm.costCenter}
                        onChange={(e) => setPaymentVoucherForm(prev => ({ ...prev, costCenter: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold focus:outline-none"
                      >
                        <option value="kindergarten">مرحلة الروضة والتمهيدي</option>
                        <option value="primary">مرحلة التعليم الابتدائي</option>
                        <option value="middle">مرحلة التعليم المتوسط</option>
                        <option value="secondary">مرحلة التعليم الثانوي</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">الحساب المصروف منه (أصول سيولة):</label>
                      <select 
                        value={paymentVoucherForm.paidFromAccount}
                        onChange={(e) => setPaymentVoucherForm(prev => ({ ...prev, paidFromAccount: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold focus:outline-none"
                      >
                        {accounts.filter(a => a.classification === 'أصول' && a.type === 'فرعي' && (a.code === '1101' || a.code === '1102')).map(a => (
                          <option key={a.code} value={a.code}>
                            {a.code} - {a.name} (الرصيد: {a.balance.toLocaleString()} {currency})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">الحساب المدين / المصروف له (شجرة المصاريف):</label>
                      <select 
                        value={paymentVoucherForm.paidToAccount}
                        onChange={(e) => setPaymentVoucherForm(prev => ({ ...prev, paidToAccount: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold focus:outline-none"
                      >
                        {accounts.filter(a => a.classification === 'مصروفات' && a.type === 'فرعي').map(a => (
                          <option key={a.code} value={a.code}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">طريقة الصرف والدفع:</label>
                      <select 
                        value={paymentVoucherForm.paymentMethod}
                        onChange={(e) => setPaymentVoucherForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold focus:outline-none"
                      >
                        <option value="نقدي">💵 صرف نقدي من الخزينة</option>
                        <option value="صك">🖹 صك مصرفي مقبول الدفع</option>
                        <option value="تحويل">💳 تحويل إلكتروني معتمد</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                      <label className="block text-slate-700 font-bold mb-1">البيان والشرح وتوضيح أسباب الصرف:</label>
                      <input 
                        type="text" 
                        required
                        value={paymentVoucherForm.against}
                        onChange={(e) => setPaymentVoucherForm(prev => ({ ...prev, against: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500"
                        placeholder="ما تم صرف المبلغ لأجله بالتفصيل"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">المبلغ المصروف:</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={paymentVoucherForm.amount}
                        onChange={(e) => setPaymentVoucherForm(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-full bg-rose-50 text-rose-950 font-mono font-black text-sm text-left border border-rose-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Drag and Drop File Upload Container for Payments */}
                  <div className="space-y-1">
                    <label className="block text-slate-700 font-bold mb-1">إرفاق الفاتورة أو إيصال استلام المستفيد (اختياري):</label>
                    <div 
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-rose-500', 'bg-rose-50/50'); }}
                      onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-rose-500', 'bg-rose-50/50'); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-rose-500', 'bg-rose-50/50');
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          setPaymentVoucherForm(prev => ({ ...prev, attachmentName: file.name }));
                          triggerNotification(`✓ تم التقاط مرفق الصرف بنجاح: ${file.name}`, 'success');
                        }
                      }}
                      className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-rose-500 hover:bg-slate-50 transition-all group flex flex-col items-center justify-center gap-2"
                      onClick={() => {
                        const fileInput = document.getElementById('payment-file-input');
                        if (fileInput) fileInput.click();
                      }}
                    >
                      <Upload className="w-8 h-8 text-slate-400 group-hover:text-rose-500 transition-colors" />
                      <p className="font-extrabold text-slate-700 text-xs">اسحب وأفلت صورة الفاتورة أو إيصال التوقيع هنا، أو اضغط للتصفح</p>
                      <p className="text-[10px] text-slate-400 font-medium">يدعم صيغ PDF, PNG, JPG لغاية حجم 5 ميجابايت</p>
                      <input 
                        type="file" 
                        id="payment-file-input" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setPaymentVoucherForm(prev => ({ ...prev, attachmentName: file.name }));
                            triggerNotification(`✓ تم تحميل مرفق الصرف بنجاح: ${file.name}`, 'success');
                          }
                        }}
                      />
                    </div>
                    {paymentVoucherForm.attachmentName && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between mt-2 font-bold text-slate-700">
                        <span className="flex items-center gap-2 text-indigo-700">
                          <FileText className="w-4 h-4" />
                          <span>{paymentVoucherForm.attachmentName}</span>
                        </span>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaymentVoucherForm(prev => ({ ...prev, attachmentName: '' }));
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ملاحظات وشهود ومبررات الصرف العاجل:</label>
                    <textarea 
                      value={paymentVoucherForm.notes}
                      onChange={(e) => setPaymentVoucherForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-normal focus:outline-none"
                    />
                  </div>

                  <div className="pt-3">
                    <button 
                      type="submit"
                      disabled={!canonicalWriteReady}
                      aria-disabled={!canonicalWriteReady}
                      className="w-full bg-gradient-to-r from-rose-600 to-red-650 hover:from-rose-700 hover:to-red-700 text-white font-black py-3 rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <Coins className="w-4 h-4 text-white" />
                      <span>{paymentSubmitLabel}</span>
                    </button>
                    {!canonicalWriteReady && (
                      <p role="alert" className="mt-2 text-[10px] font-bold text-amber-700">
                        المعاينة متاحة فقط؛ لا يتم حفظ سند صرف أو قيد مزدوج قبل اعتماد مسار مركزي كامل.
                      </p>
                    )}
                  </div>
                </form>
              </div>

              {/* Right Side: Informational Widget & Guidelines */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-50 text-slate-800 p-6 rounded-xl shadow-xs border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-rose-700">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    <span className="font-black text-sm">سياسة الصرف والرقابة الداخلية الصارمة</span>
                  </div>
                  <ul className="space-y-3 font-semibold text-slate-650 text-[11px] leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="bg-slate-200 text-rose-800 p-0.5 px-1.5 rounded text-[10px] font-mono mt-0.5">01</span>
                      <span><strong>توفر الميزانية:</strong> يمنع النظام صرف أي قيمة تزيد عن ميزانية البند السنوية دون موافقة كتابية ومباشرة من المدير المالي.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-slate-200 text-rose-800 p-0.5 px-1.5 rounded text-[10px] font-mono mt-0.5">02</span>
                      <span><strong>القيد التلقائي:</strong> عند ترحيل السند، يقوم محرك الحسابات بخصم رصيد الأصول المصروف منها (دائن) وزيادة بند المصروفات الفرعي (مدين) بنظام القيد المزدوج.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-slate-200 text-rose-800 p-0.5 px-1.5 rounded text-[10px] font-mono mt-0.5">03</span>
                      <span><strong>مطابقة المرفقات:</strong> تدرج صورة الفاتورة المرفقة ضمن ملف الأرشفة العام لتسهيل التصفح ومراجعة ديوان المحاسبة ومكتب تدقيق الحسابات الخارجي.</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center font-bold text-[10px]">
                      <span className="text-slate-500">السيولة المتاحة بالحساب الجاري:</span>
                      <span className="text-rose-700 font-mono text-xs">
                        {(accounts.find(a => a.code === '1102')?.balance ?? 0).toLocaleString()} {currency}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
                  <h3 className="font-black text-slate-900 text-xs">مستندات الصرف والمرفقات</h3>
                  <p className="text-slate-500 leading-normal text-[10px]">قائمة بالمرفقات والملفات الفنية الخاصة بسندات الصرف الحالية.</p>
                  
                  <div className="divide-y divide-slate-100 font-semibold text-[11px]">
                    {paymentVouchers.filter(v => v.attachmentName).slice(0, 3).map(v => (
                      <div key={v.id} className="py-2.5 flex items-center justify-between">
                        <span className="text-slate-700 truncate max-w-[150px]">{v.attachmentName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{v.id}</span>
                          <button 
                            onClick={() => triggerNotification(`فتح المستند المرفق: ${v.attachmentName}`, 'info')}
                            className="text-indigo-600 hover:text-indigo-800 font-bold"
                          >
                            معاينة
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Vouchers History Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mt-6">
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">أرشيف وسجل سندات الصرف المالي</h3>
                  <p className="text-slate-500 text-[10px] mt-0.5">البحث، الفرز وطباعة سندات الصرف الصادرة للجهات والموردين والموظفين YTD</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    <input 
                      type="text"
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      placeholder="ابحث باسم المستفيد أو الشرح..."
                      className="bg-white border border-slate-200 rounded-lg pl-3 pr-9 py-1.5 text-[11px] font-bold w-48 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  {/* Cost Center Quick Filters */}
                  <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-300">
                    <button 
                      onClick={() => setPaymentCostCenterFilter('all')}
                      className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all ${
                        paymentCostCenterFilter === 'all' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      الكل
                    </button>
                    <button 
                      onClick={() => setPaymentCostCenterFilter('kindergarten')}
                      className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all ${
                        paymentCostCenterFilter === 'kindergarten' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      الروضة
                    </button>
                    <button 
                      onClick={() => setPaymentCostCenterFilter('primary')}
                      className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all ${
                        paymentCostCenterFilter === 'primary' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      الابتدائي
                    </button>
                    <button 
                      onClick={() => setPaymentCostCenterFilter('middle')}
                      className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all ${
                        paymentCostCenterFilter === 'middle' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      المتوسط
                    </button>
                    <button 
                      onClick={() => setPaymentCostCenterFilter('secondary')}
                      className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all ${
                        paymentCostCenterFilter === 'secondary' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      الثانوي
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">كود السند</th>
                      <th className="px-6 py-3">تاريخه</th>
                      <th className="px-6 py-3">المستفيد</th>
                      <th className="px-6 py-3">مركز التكلفة</th>
                      <th className="px-6 py-3">المبلغ المصروف</th>
                      <th className="px-6 py-3">الحساب المصروف منه</th>
                      <th className="px-6 py-3">حساب البند المصروف</th>
                      <th className="px-6 py-3 text-center">طريقة الدفع</th>
                      <th className="px-6 py-3 text-center">المرفق</th>
                      <th className="px-6 py-3 text-center">الحالة</th>
                      <th className="px-6 py-3 text-left">التحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                    {paymentVouchers
                      .filter(v => {
                        const matchesCC = paymentCostCenterFilter === 'all' || getVoucherStageKey(v) === paymentCostCenterFilter;
                        const matchesSearch = v.beneficiary.toLowerCase().includes(paymentSearch.toLowerCase()) || 
                                              v.against.toLowerCase().includes(paymentSearch.toLowerCase());
                        return matchesCC && matchesSearch;
                      })
                      .map(v => (
                        <tr key={v.id} className={`hover:bg-slate-50/70 ${v.status === 'ملغى' ? 'bg-red-50/40 text-slate-400 line-through' : ''}`}>
                          <td className="px-6 py-3.5 font-mono font-black text-rose-700">{v.id}</td>
                          <td className="px-6 py-3.5 font-mono text-slate-500">{v.date}</td>
                          <td className="px-6 py-3.5 font-bold text-slate-900">
                            {v.beneficiary}
                            <span className="block text-[9px] text-slate-400 font-medium font-sans mt-0.5">{v.against}</span>
                          </td>
                          <td className="px-6 py-3.5 text-slate-700">
                            <span className="p-1 px-2 bg-slate-100 rounded text-[9px] font-black border border-slate-200">
                              {getVoucherCostCenterLabel(v)}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 font-mono font-black text-rose-600 text-sm" dir="ltr">
                            {v.amount.toLocaleString()} {currency}
                          </td>
                          <td className="px-6 py-3.5 font-mono text-slate-600 text-xs">
                            {v.paidFromAccount === '1101' ? '1101 - الخزينة' : '1102 - بنك الوحدة'}
                          </td>
                          <td className="px-6 py-3.5 font-mono text-slate-600 text-xs font-bold">
                            {v.paidToAccount} - {accounts.find(a => a.code === v.paidToAccount)?.nameAr || 'مصروف'}
                          </td>
                          <td className="px-6 py-3 text-center font-bold text-slate-700">{v.paymentMethod}</td>
                          <td className="px-6 py-3 text-center">
                            {v.attachmentName ? (
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 inline-flex items-center gap-1 font-bold">
                                <Check className="w-3 h-3" /> متاح
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-medium">---</span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                              v.status === 'معتمد' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              v.status === 'ملغى' ? 'bg-red-100 text-red-800 border border-red-200' :
                              'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {v.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-left">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedPaymentVoucher(v);
                                  setShowPaymentDetailModal(true);
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg flex items-center gap-1 font-extrabold text-[10px]"
                                title="عرض ومعاينة السند المحاسبي للطباعة"
                              >
                                <Printer className="w-3 h-3" />
                                <span>طباعة السند</span>
                              </button>
                              {v.status !== 'ملغى' && (
                                <button 
                                  onClick={() => {
                                    if (!canonicalWriteReady) {
                                      triggerNotification('إلغاء سند الصرف متوقف: المصدر للقراءة فقط ولا يوجد مسار عكسي كانوني.', 'warning');
                                      return;
                                    }
                                    if (confirm(`هل أنت متأكد من إلغاء سند الصرف ${v.id}؟ سيتم تصفير أثره المحاسبي وعكس القيد`)) {
                                      const cancelReason = window.prompt("الرجاء إدخال سبب إلغاء سند الصرف:");
                                      if (!cancelReason || cancelReason.trim() === "") {
                                        triggerNotification("⚠️ يجب تحديد سبب لإلغاء السند المالي.", "warning");
                                        return;
                                      }

                                      const voidedAt = new Date().toLocaleDateString('ar-LY') + ' ' + new Date().toLocaleTimeString('ar-LY');
                                      setPaymentVouchers(prev => prev.map(item => item.id === v.id ? { 
                                        ...item, 
                                        status: 'ملغى' as const,
                                        voidReason: cancelReason,
                                        voidedBy: 'سليمان غازي',
                                        voidedAt
                                      } : item));
                                      // Reverse ledger balance
                                      setAccounts(prev => prev.map(acc => {
                                        if (acc.code === v.paidFromAccount) { // Return money to Cash/Bank (debit back)
                                          return { ...acc, balance: acc.balance + v.amount };
                                        }
                                        if (acc.code === v.paidToAccount) { // Deduct from expense account (credit back)
                                          return { ...acc, balance: acc.balance - v.amount };
                                        }
                                        return acc;
                                      }));
                                      // Append reverse JV
                                      const reverseJv = {
                                        id: `JV-2026-REV-${String(Math.floor(Math.random() * 899) + 100)}`,
                                        date: new Date().toISOString().split('T')[0],
                                        description: `عكس وإلغاء سند صرف رقم ${v.id} - سبب الإلغاء: ${cancelReason}`,
                                        debitTotal: v.amount,
                                        creditTotal: v.amount,
                                        status: 'مرحل'
                                      };
                                      setJournalEntries(prev => [reverseJv, ...prev]);

                                      // Log in unified EnterpriseAuditLogger
                                      EnterpriseAuditLogger.log({
                                        action: 'إلغاء اعتماد',
                                        oldValue: v,
                                        newValue: { ...v, status: 'ملغى', voidReason: cancelReason, voidedBy: 'سليمان غازي', voidedAt },
                                        userName: 'سليمان غازي',
                                        userRole: 'Manager',
                                        module: 'الحسابات العامة',
                                        device: 'نظام الإدارة المالية المركزي'
                                      });

                                      triggerNotification(`✓ تم إلغاء سند الصرف ${v.id} وتوطين القيد العكسي كلياً!`, 'warning');
                                    }
                                  }}
                                  disabled={!canonicalWriteReady}
                                  className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg font-extrabold text-[10px] flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                                  title={canonicalWriteReady ? 'إلغاء السند وعكس القيد' : 'الإلغاء متوقف — المصدر المالي للقراءة فقط'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
    </>
  );
};
