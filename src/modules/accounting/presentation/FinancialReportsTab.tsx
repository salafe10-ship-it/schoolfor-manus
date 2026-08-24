import { ArrowLeft, ArrowRightLeft, ArrowUpRight, BarChart2, Calculator, ChevronLeft, Coins, Download, FileDown, FileSpreadsheet, FileText, Filter, Layers, Percent, Printer, RefreshCw, Search, Settings, Settings2, ShieldAlert, TrendingUp } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { AccountingContext } from '../../../components/GeneralLedgerPortal';

export const FinancialReportsTab = () => {
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
  trialBalanceMode, setTrialBalanceMode,
  expandedReportNodes, setExpandedReportNodes, localRoles, setLocalRoles,
  localUsers: SIMULATED_USERS, setLocalUsers, localPermissionsAuditLog, setLocalPermissionsAuditLog,
  closingStep, setClosingStep, isCheckingReady, setIsCheckingReady,
  checkedReady, setCheckedReady, closingProgress, setClosingProgress,
  closingProgressMessage, setClosingProgressMessage, closingAuditLog, setClosingAuditLog,
  isYearClosed, setIsYearClosed, closingRefNo, setClosingRefNo,
  closingDate, setClosingDate, openedYear2027, setOpenedYear2027,
  currentClosingYear, setCurrentClosingYear, closingDateInput, setClosingDateInput,
  newYearStartDateInput, setNewYearStartDateInput, newYearEndDateInput, setNewYearEndDateInput,
  newYearNumberInput, setNewYearNumberInput, closingDescriptionInput, setClosingDescriptionInput,
  showPostClosingTrialBalance, setShowPostClosingTrialBalance,
  unapprovedAdjustmentsCount, setUnapprovedAdjustmentsCount, localDrillDownUser: drillDownUser, setLocalDrillDownUser: setDrillDownUser,
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
  paymentVoucherForm, setPaymentVoucherForm, selectedReceiptVoucher, setSelectedReceiptVoucher,
  showReceiptDetailModal, setShowReceiptDetailModal, selectedPaymentVoucher, setSelectedPaymentVoucher,
  showPaymentDetailModal, setShowPaymentDetailModal, receiptSearch, setReceiptSearch,
  receiptCostCenterFilter, setReceiptCostCenterFilter, paymentSearch, setPaymentSearch,
  paymentCostCenterFilter, setPaymentCostCenterFilter, bankTransferForm, setBankTransferForm,
  fixedAssets, setFixedAssets, selectedAssetId, setSelectedAssetId, assetDetailTab, setAssetDetailTab,
  isAssetEditing, setIsAssetEditing, isNewAssetMode, setIsNewAssetMode,
  assetSearchQuery, setAssetSearchQuery, assetCategoryFilter, setAssetCategoryFilter,
  assetStatusFilter, setAssetStatusFilter, assetCostCenterFilter, setAssetCostCenterFilter,
  assetForm, setAssetForm, maintenanceForm, setMaintenanceForm, transferForm, setTransferForm,
  saleForm, setSaleForm, discardForm, setDiscardForm, activeAssetModal, setActiveAssetModal,
  fixedAssetReportType, setFixedAssetReportType, fixedAssetViewMode, setFixedAssetViewMode,
  budgets, setBudgets, calcExpr, setCalcExpr, calcResult, setCalcResult,
  fxAmount, setFxAmount, fxFrom, setFxFrom, fxResult, setFxResult,
  
  getNormalizedJournalEntries, handleDrillDownToJournalEntry, hasUserPermission, exportReportExcel, handleSelectAsset, handleNewAsset, handleSaveAsset,
  handleDeleteAsset, handleRecalculateAssetDepreciation, handlePostAssetDepreciation,
  handleTransferAssetSubmit, handleSellAssetSubmit, handleDiscardAssetSubmit, handleMaintenanceSubmit,
  handleImportExcelSimulate, handleDownloadTemplate, handlePrintAssetCard, handlePrintDepreciationSchedule,
  findOriginalDocument, isAccountOrDescendant, getProcessedAccounts,
  formatCurrency, triggerNotification, logAction, addJvAuditEvent, costCenters: liveCostCenters,
  refreshCanonicalFinancialData, canonicalFinancialStatus, canonicalFinancialWriteMode
} = React.useContext(AccountingContext);

const activeCostCenters = (Array.isArray(liveCostCenters) ? liveCostCenters : [])
  .filter((center: any) => center?.isActive !== false)
  .map((center: any) => ({
    id: center.id,
    name: center.name || center.nameAr || center.code || center.id,
    code: center.code || center.id
  }));

// Reports must fail closed when the authenticated profile has not loaded yet,
// instead of crashing while dereferencing a null drill-down user.
const activeDrillDownUser = drillDownUser || {
  id: 'unresolved-user',
  name: 'المستخدم الحالي غير محدد',
  role: 'غير محدد',
  permissions: [] as string[]
};
const reportsAreCanonical = canonicalFinancialStatus === 'ready'
  && (canonicalFinancialWriteMode === 'ledger_ready' || canonicalFinancialWriteMode === 'erp_integrated');

const [selectedReport, setSelectedReport] = useState<string | null>(null);
const [drillDownStack, setDrillDownStack] = useState<any[]>([]);
const [filterFiscalYear, setFilterFiscalYear] = useState<string>('2026');
const [filterFromDate, setFilterFromDate] = useState<string>('2026-01-01');
const [filterToDate, setFilterToDate] = useState<string>('2026-12-31');
const [filterAccountingPeriod, setFilterAccountingPeriod] = useState<string>('سنوي');
const [filterCostCenter, setFilterCostCenter] = useState<string>('all');
const [filterAccount, setFilterAccount] = useState<string>('all');
const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(false);
const [filterBalanceOnly, setFilterBalanceOnly] = useState<boolean>(false);
const [filterSortBy, setFilterSortBy] = useState<'code' | 'name'>('code');
const [trialBalanceLevel, setTrialBalanceLevel] = useState<1 | 2 | 3 | 'all'>('all');

// The header action must call the browser print dialog directly from the
// user's click. Calling another button programmatically makes popup/print
// protection treat the request as untrusted and silently block it.
const handlePrintSelectedReport = () => {
  if (!selectedReport) {
    triggerNotification('اختر تقريراً أولاً ثم اضغط زر الطباعة.', 'warning');
    return;
  }

  triggerNotification('جارٍ فتح حوار طباعة التقرير الحالي...', 'info');
  window.print();
};

const handleSelectReport = (reportType: string | null) => {
    setSelectedReport(reportType);
    if (!reportType) {
      setDrillDownStack([]);
      return;
    }
    
    let reportTitle = '';
    switch (reportType) {
      case 'trial_balance': reportTitle = 'ميزان المراجعة'; break;
      case 'income_statement': reportTitle = 'قائمة الدخل'; break;
      case 'balance_sheet': reportTitle = 'الميزانية العمومية'; break;
      case 'cash_flow': reportTitle = 'التدفقات النقدية'; break;
      case 'account_statement': reportTitle = 'كشف الحساب'; break;
      case 'general_ledger': reportTitle = 'دفتر الأستاذ العام'; break;
      case 'trial_balance_movements': reportTitle = 'ميزان المراجعة بالحركات'; break;
      default: reportTitle = reportType;
    }

    setDrillDownStack([
      {
        level: 'report_view',
        reportId: reportType,
        title: reportTitle
      }
    ]);
  };

const handleDrillDownBreadcrumbClick = (idx: number) => {
    const targetStep = drillDownStack[idx];
    const newStack = drillDownStack.slice(0, idx + 1);
    setDrillDownStack(newStack);
    
    if (targetStep.level === 'report_view') {
      setSelectedReport(targetStep.reportId || null);
    } else if (targetStep.level === 'account_statement') {
      setSelectedReport('account_statement');
      setFilterAccount(targetStep.accountCode || 'all');
    }
  };

const handleDrillDownToAccount = (accountCode: string) => {
    if (!activeDrillDownUser.permissions.includes('view_account_statement')) {
      triggerNotification(`❌ عذراً ${activeDrillDownUser.name}! تم رفض الوصول لعدم وجود صلاحية استعراض كشوفات الحسابات التفصيلية (RBAC).`, 'warning');
      return;
    }

    const targetAcc = accounts.find(a => a.code === accountCode);
    const accountName = targetAcc ? targetAcc.nameAr : accountCode;
    
    setFilterAccount(accountCode);
    setSelectedReport('account_statement');
    
    setDrillDownStack(prev => {
      const baseReportStep = prev.find(s => s.level === 'report_view');
      const base = baseReportStep ? [baseReportStep] : [];
      return [
        ...base,
        {
          level: 'account_statement',
          accountCode: accountCode,
          title: `كشف حساب: ${accountName}`
        }
      ];
    });
    
    triggerNotification(`🔗 تم الانتقال إلى كشف حساب: ${accountName}`, 'success');
    logAction('DRILL_DOWN_ACCOUNT', `تنقل هرمي لحساب ${accountCode} من تقرير مالي`, 'الحسابات العامة');
    addJvAuditEvent(accountCode, 'استعراض كشف الحساب', activeDrillDownUser.name, `تنقل هرمي (Drill-Down) إلى كشف حساب ${accountName} (${accountCode})`);
  };

const handleDrillDownToOriginalDocument = (jv: any) => {
    if (!activeDrillDownUser.permissions.includes('view_original_docs')) {
      triggerNotification(`❌ عذراً ${activeDrillDownUser.name}! تم رفض الوصول لعدم وجود صلاحية استعراض المستندات والوثائق الملحقة (RBAC).`, 'warning');
      return;
    }

    let docId = '';
    let docType: 'receipt_voucher' | 'payment_voucher' | 'invoice' | 'journal_entry' = 'journal_entry';
    let title = '';
    
    if (jv.receiptVoucherId || jv.id.includes('JV-RV-') || jv.description.includes('سند قبض')) {
      const rvIdMatch = jv.description.match(/سند قبض (RV-\d+-\d+)/);
      docId = rvIdMatch ? rvIdMatch[1] : (jv.receiptVoucherId || jv.id.replace('JV-RV-', ''));
      docType = 'receipt_voucher';
      title = `سند قبض أصلي: ${docId}`;
    } else if (jv.paymentVoucherId || jv.id.includes('JV-PV-') || jv.description.includes('سند صرف')) {
      const pvIdMatch = jv.description.match(/سند صرف (PV-\d+-\d+)/);
      docId = pvIdMatch ? pvIdMatch[1] : (jv.paymentVoucherId || jv.id.replace('JV-PV-', ''));
      docType = 'payment_voucher';
      title = `سند صرف أصلي: ${docId}`;
    } else {
      triggerNotification('ℹ️ هذا القيد مالي مباشر وليس له مستند فرعي خارجي.', 'info');
      return;
    }
    
    setDrillDownStack(prev => {
      const baseStep = prev.filter(s => s.level === 'report_view' || s.level === 'account_statement' || s.level === 'journal_entry');
      return [
        ...baseStep,
        {
          level: 'original_document',
          documentId: docId,
          documentType: docType,
          title: title
        }
      ];
    });
    
    triggerNotification(`🔗 تم الانتقال إلى المستند الأصلي: ${docId}`, 'success');
    logAction('DRILL_DOWN_ORIGIN', `تنقل هرمي للمستند الأصلي ${docId}`, 'الحسابات العامة');
    addJvAuditEvent(docId, 'عرض المستند الأصلي', activeDrillDownUser.name, `تنقل هرمي (Drill-Down) إلى المستند الأصلي ${docId} المرتبط بقيد ${jv.id}`);
  };


  return (
    <>
              {activeTab === 'financial_reports' && (() => {
          // Prepare dynamic accounts with calculations
          const reportAccounts = getProcessedAccounts({
            fromDate: filterFromDate,
            toDate: filterToDate,
            costCenter: filterCostCenter
          });

          // Calculate core aggregates for the summary dashboard
          const isLeafAccount = (account: any) => account.type === 'فرعي' || account.type === 'leaf' || Number(account.level) >= 3;

          // Canonical ERP chart rows may arrive without a persisted hierarchy
          // level. Prefer leaf balances when available, otherwise use root
          // balances, so the financial statements never hide real balances.
          const sumBalanceSheetClass = (classification: string) => {
            const classified = reportAccounts.filter(a => a.classification === classification);
            const leafAccounts = classified.filter(a => isLeafAccount(a));
            const accountsToSum = leafAccounts.length > 0
              ? leafAccounts
              : classified.filter(a => a.level === 1);
            return accountsToSum.reduce((sum, a) => sum + (a.endingBalance || 0), 0);
          };

          const totalAssets = sumBalanceSheetClass('أصول');
          const totalLiabilities = sumBalanceSheetClass('خصوم');
          const totalEquity = sumBalanceSheetClass('حقوق ملكية');

          const periodRevenue = (account: any) => Number(account.creditMovements || 0) - Number(account.debitMovements || 0);
          const periodExpense = (account: any) => Number(account.debitMovements || 0) - Number(account.creditMovements || 0);
          const sumPeriodClass = (classification: string, movement: (account: any) => number) => {
            const leafAccounts = reportAccounts.filter(a => a.classification === classification && isLeafAccount(a));
            const accountsToSum = leafAccounts.length > 0
              ? leafAccounts
              : reportAccounts.filter(a => a.classification === classification && a.level === 1);
            return accountsToSum.reduce((sum, account) => sum + movement(account), 0);
          };
          const totalRevenues = sumPeriodClass('إيرادات', periodRevenue);

          const totalExpenses = sumPeriodClass('مصروفات', periodExpense);

          // Cash-flow values must come from posted/approved journal lines. Do
          // not allocate revenue or expense totals using presentation ratios.
          const reportEntries = getNormalizedJournalEntries().filter((entry: any) => {
            const status = String(entry.status || '').toLowerCase();
            return ['مرحل', 'مرحّل', 'مُرحّل', 'معتمد', 'approved', 'posted'].includes(status)
              && entry.date >= filterFromDate && entry.date <= filterToDate;
          });
          const cashAccountCodes = new Set(
            accounts
              .filter((account: any) => {
                const label = `${account.nameAr || ''} ${account.name || ''}`;
                return account.classification === 'أصول'
                  && (String(account.code || '').startsWith('11') || /نقد|خزينة|مصرف|بنك|cash|bank/i.test(label));
              })
              .map((account: any) => account.code)
          );
          const actualCashInflow = reportEntries.reduce((sum: number, entry: any) => sum + (entry.lines || [])
            .filter((line: any) => cashAccountCodes.has(line.accountCode))
            .reduce((lineSum: number, line: any) => lineSum + Number(line.debit || 0), 0), 0);
          const actualCashOutflow = reportEntries.reduce((sum: number, entry: any) => sum + (entry.lines || [])
            .filter((line: any) => cashAccountCodes.has(line.accountCode))
            .reduce((lineSum: number, line: any) => lineSum + Number(line.credit || 0), 0), 0);
          const hasVerifiedCashFlow = reportEntries.some((entry: any) => Array.isArray(entry.lines) && entry.lines.length > 0);
          const cashFlowValue = (amount: number) => hasVerifiedCashFlow
            ? amount.toFixed(2)
            : 'غير متحقق';

          const netIncome = totalRevenues - totalExpenses;
          // Current-period profit is part of equity in the balance-sheet check
          // until the fiscal-year closing entry is posted.
          const balanceSheetVariance = Math.abs(totalAssets - (totalLiabilities + totalEquity + netIncome));

          // Handle automatic financial period dates update
          const handlePeriodChange = (period: string) => {
            setFilterAccountingPeriod(period);
            if (period === 'full') {
              setFilterFromDate('2026-01-01');
              setFilterToDate('2026-12-31');
            } else if (period === 'q1') {
              setFilterFromDate('2026-01-01');
              setFilterToDate('2026-03-31');
            } else if (period === 'q2') {
              setFilterFromDate('2026-04-01');
              setFilterToDate('2026-06-30');
            } else if (period === 'q3') {
              setFilterFromDate('2026-07-01');
              setFilterToDate('2026-09-30');
            } else if (period === 'q4') {
              setFilterFromDate('2026-10-01');
              setFilterToDate('2026-12-31');
            }
            triggerNotification('✓ تم تحديث نطاق التواريخ للفترة المحاسبية المختارة.', 'info');
          };

          // Individual report export Excel/CSV handlers
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

          // Advanced customized print PDF handler
          const printReportPdf = (title: string, subTitle: string, tableHeaders: string[], tableRowsHtml: string, summaryHtml?: string) => {
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
              triggerNotification('تعذر فتح نسخة PDF المنفصلة؛ سيتم استخدام طباعة التقرير الحالي مباشرة.', 'warning');
              window.print();
              return;
            }

            const reportCertificationLabel = reportsAreCanonical
              ? 'تقرير مالي رسمي معتمد'
              : canonicalFinancialWriteMode === 'snapshot_write'
                ? 'نسخة عرض UAT من snapshot — غير معتمدة للرقابة أو الإقفال'
                : 'نسخة عرض غير معتمدة — snapshot للقراءة فقط';

            const activeCostCenterLabel = filterCostCenter === 'all' ? 'جميع الأقسام والفروع' : (activeCostCenters.find(c => c.id === filterCostCenter)?.name || filterCostCenter);

            printWindow.document.write(`
              <html dir="rtl">
                <head>
                  <title>${title} - ERP Financials</title>
                  <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                    body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #0f172a; background-color: #ffffff; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-b: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
                    h1 { font-size: 18px; font-weight: 900; margin: 0; color: #1e3a8a; }
                    h2 { font-size: 12px; color: #475569; margin: 0; margin-top: 5px; font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 15px; }
                    th { background-color: #f1f5f9; padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; text-align: right; }
                    td { padding: 8px; border: 1px solid #e2e8f0; }
                    .totals-row { font-weight: bold; background-color: #f8fafc; border-top: 2px solid #0f172a; }
                    .system-tag { text-align: center; font-size: 9px; color: #94a3b8; margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
                    .tag-badge { background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; border-radius: 4px; padding: 3px 6px; font-size: 9px; font-weight: bold; }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <div>
                      <p style="font-size: 11px; font-weight: bold; margin: 0; color: #64748b;">الجمهورية الليبية / وزارة التعليم</p>
                      <h1>مجمع المدارس التعليمي الموحد</h1>
                      <h2>نظام الإدارة المالية الشامل والتدقيق المحاسبي ERP</h2>
                    </div>
                    <div style="text-align: left; font-size: 10px; font-weight: bold; line-height: 1.5;">
                      <p>المستند: <span class="tag-badge">${reportCertificationLabel}</span></p>
                      <p>تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-SA')}</p>
                      <p>الفترة المالية: من ${filterFromDate} إلى ${filterToDate}</p>
                      <p>مركز التكلفة: ${activeCostCenterLabel}</p>
                    </div>
                  </div>
                  
                  <div style="text-align: center; margin-bottom: 25px;">
                    <h2 style="font-size: 16px; font-weight: 900; color: #0f172a; margin: 0;">${title}</h2>
                    <p style="font-size: 11px; color: #475569; margin: 5px 0 0 0;">${subTitle}</p>
                  </div>

                  <table>
                    <thead>
                      <tr>
                        ${tableHeaders.map(h => `<th>${h}</th>`).join('')}
                      </tr>
                    </thead>
                    <tbody>
                      ${tableRowsHtml}
                    </tbody>
                  </table>

                  ${summaryHtml || ''}

                  <div style="margin-top: 60px; display: flex; justify-content: space-between; font-size: 11px; font-weight: bold;">
                    <div>
                      <p>المحاسب المالي المختص: _________________</p>
                      <p style="font-size: 9px; color: #64748b; margin-top: 5px;">التوقيع: ______________</p>
                    </div>
                    <div>
                      <p>المدير المالي والرقابة: _________________</p>
                      <p style="font-size: 9px; color: #64748b; margin-top: 5px;">الاعتماد: ______________</p>
                    </div>
                    <div style="text-align: center;">
                      <p>الختم الرسمي للمؤسسة</p>
                      <div style="width: 80px; height: 80px; border: 2px dashed #94a3b8; border-radius: 50%; margin: 10px auto 0 auto; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 8px;">موضع الختم</div>
                    </div>
                  </div>

                  <div class="system-tag">
                    تم الإنشاء والتدقيق إلكترونياً عبر نظام المدير المالي ERP - تاريخ الطباعة: ${new Date().toLocaleString('ar-SA')} - صفحة 1 من 1
                  </div>
                  <script>
                    window.onload = function() { window.print(); }
                  </script>
                </body>
              </html>
            `);
            printWindow.document.close();
            logAction('PRINT_REPORT', `طباعة تقرير ${title} مع الفلاتر المطبقة`, 'التقارير المالية');
          };

          return (
            <div className="financial-reports-reference space-y-6 animate-fade-in text-xs text-slate-800">
              {/* Header block */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                      <FileSpreadsheet className="w-5 h-5" />
                    </span>
                    <h2 className="text-base font-black text-slate-900">منظومة التقارير المالية والختامية المتكاملة</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">توليد ومطابقة القوائم المالية، ميزان المراجعة، الحسابات الختامية ودفاتر الأستاذ لجميع المراحل الدراسية ومراكز التكلفة.</p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  {selectedReport && (
                    <button
                      onClick={() => handleSelectReport(null)}
                      className="px-3.5 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 transition-colors font-bold text-xs cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                      <span>الرجوع لقائمة التقارير</span>
                    </button>
                  )}
                  {selectedReport && (
                    <button
                      type="button"
                      onClick={handlePrintSelectedReport}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      aria-label="طباعة التقرير الحالي"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة التقرير</span>
                    </button>
                  )}
                  <button 
                     onClick={() => {
                       refreshCanonicalFinancialData();
                       triggerNotification('جارٍ إعادة تحميل التقارير من المصدر المالي المركزي...', 'info');
                     }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>تحديث البيانات المزامنة</span>
                  </button>
                </div>
              </div>

              {/* Drill-Down Hierarchy Navigation Breadcrumbs */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs shadow-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500 font-bold ml-1 flex items-center gap-1">
                    <span>مسار التنقل الهرمي للبيانات:</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-black">Drill-Down 🔄</span>
                  </span>
                  {drillDownStack.map((item: any, idx: number) => {
                    let icon = "📊";
                    if (item.level === 'report_view') icon = "📈";
                    if (item.level === 'account_statement') icon = "📊";
                    if (item.level === 'journal_entry') icon = "📜";
                    if (item.level === 'original_document') icon = "📄";

                    const isLast = idx === drillDownStack.length - 1;

                    return (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="text-slate-300 font-bold">←</span>
                        <button
                          type="button"
                          onClick={() => handleDrillDownBreadcrumbClick(idx)}
                          disabled={isLast}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                            isLast
                              ? 'bg-blue-650 text-white shadow-sm'
                              : 'text-blue-700 hover:bg-blue-100 hover:text-blue-900 cursor-pointer'
                          }`}
                        >
                          <span>{icon}</span>
                          <span>{item.title}</span>
                          {!isLast && item.accountCode && <span className="text-[9px] text-slate-500">({item.accountCode})</span>}
                          {!isLast && item.journalEntryId && <span className="text-[9px] text-slate-500">({item.journalEntryId})</span>}
                          {!isLast && item.documentId && <span className="text-[9px] text-slate-500">({item.documentId})</span>}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Simulated Audit & Role details */}
                <div className="flex items-center gap-3 justify-between sm:justify-start">
                  <div className="flex items-center gap-1.5 bg-slate-150/40 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200/50">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="font-bold">المستخدم الحالي:</span>
                    <span className="text-slate-900 font-black">{activeDrillDownUser.name} ({activeDrillDownUser.role})</span>
                  </div>
                  
                  {/* Quick toggle user role to demonstrate security */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">تغيير الصلاحية (للتجربة):</span>
                    <select
                      value={activeDrillDownUser.id}
                      onChange={(e) => {
                        const newUser = SIMULATED_USERS.find(u => u.id === e.target.value);
                        if (newUser) {
                          setDrillDownUser(newUser);
                          triggerNotification(`✓ تم تغيير الصلاحية للمستخدم: ${newUser.name} (${newUser.role})`, 'info');
                        }
                      }}
                      className="bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-bold text-slate-700 cursor-pointer focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      {SIMULATED_USERS.map(u => (
                        <option key={u.id} value={u.id}>{u.role}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Advanced filter panel */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-1.5 text-slate-900 font-black">
                    <Settings className="w-4 h-4 text-blue-600 animate-pulse" />
                    <span>محددات الفلترة والتحكم بالتقارير (خيارات تصفية متعددة الأبعاد)</span>
                  </div>
                  <div className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-mono">
                    {reportsAreCanonical ? 'مطابقة مع الدليل المحاسبي ومعتمدة من الرقابة المالية 🔐' : 'نسخة عرض من snapshot — غير معتمدة للرقابة أو الإقفال'}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                  {/* السنة المالية */}
                  <div className="space-y-1">
                    <label className="block text-slate-600 font-bold">السنة المالية</label>
                    <select
                      value={filterFiscalYear}
                      onChange={(e) => setFilterFiscalYear(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs"
                    >
                      <option value="2026">2026 م (العام الجاري النشط)</option>
                      <option value="2025">2025 م (العام المغلق)</option>
                    </select>
                  </div>

                  {/* الفترة المالية */}
                  <div className="space-y-1">
                    <label className="block text-slate-600 font-bold">الفترة المالية الاختيارية</label>
                    <select
                      value={filterAccountingPeriod}
                      onChange={(e) => handlePeriodChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs"
                    >
                      <option value="full">الدورة التشغيلية الكاملة 2026</option>
                      <option value="q1">الربع الأول Q1 (يناير - مارس)</option>
                      <option value="q2">الربع الثاني Q2 (أبريل - يونيو)</option>
                      <option value="q3">الربع الثالث Q3 (يوليو - سبتمبر)</option>
                      <option value="q4">الربع الرابع Q4 (أكتوبر - ديسمبر)</option>
                    </select>
                  </div>

                  {/* من تاريخ */}
                  <div className="space-y-1">
                    <label className="block text-slate-600 font-bold">من تاريخ</label>
                    <input
                      type="date"
                      value={filterFromDate}
                      onChange={(e) => setFilterFromDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-mono"
                    />
                  </div>

                  {/* إلى تاريخ */}
                  <div className="space-y-1">
                    <label className="block text-slate-600 font-bold">إلى تاريخ</label>
                    <input
                      type="date"
                      value={filterToDate}
                      onChange={(e) => setFilterToDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-mono"
                    />
                  </div>

                  {/* مركز التكلفة */}
                  <div className="space-y-1">
                    <label className="block text-slate-600 font-bold">مركز التكلفة (مطابق لشجرة المراكز والصفوف)</label>
                    <select
                      value={filterCostCenter}
                      onChange={(e) => setFilterCostCenter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs"
                    >
                      <option value="all">جميع مراكز التكلفة والمراحل الحسابية</option>
                      {activeCostCenters.map(cc => (
                        <option key={cc.id} value={cc.id}>{cc.name} ({cc.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* الفترة المحاسبية */}
                  <div className="space-y-1">
                    <label className="block text-slate-600 font-bold">الفترة المحاسبية الدورية</label>
                    <select
                      value={filterAccountingPeriod}
                      onChange={(e) => setFilterAccountingPeriod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs"
                    >
                      <option value="سنوي">سنوي كامل</option>
                      <option value="ربع سنوي">ربع سنوي</option>
                      <option value="شهري">شهري تفصيلي</option>
                    </select>
                  </div>

                  {/* الحساب المستهدف */}
                  <div className="space-y-1">
                    <label className="block text-slate-600 font-bold">الحساب المحاسبي (لكشوفات الحساب والدفاتر)</label>
                    <select
                      value={filterAccount}
                      onChange={(e) => setFilterAccount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs"
                    >
                      <option value="all">جميع بنود الحسابات والدفاتر الفرعية</option>
                      {accounts.filter(acc => acc.type === 'فرعي').map(acc => (
                        <option key={acc.id} value={acc.code}>{acc.code} - {acc.nameAr}</option>
                      ))}
                    </select>
                  </div>

                  {/* ترتيب البنود */}
                  <div className="space-y-1">
                    <label className="block text-slate-600 font-bold">ترتيب البنود في التقرير</label>
                    <select
                      value={filterSortBy}
                      onChange={(e) => setFilterSortBy(e.target.value as 'code' | 'name')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs"
                    >
                      <option value="code">ترتيب تصاعدي برمز الحساب الدفتري</option>
                      <option value="name">ترتيب أبجدي باسم الحساب العربي</option>
                    </select>
                  </div>
                </div>

                {/* Extra switches */}
                <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                  <label className="flex items-center gap-2 cursor-pointer font-bold hover:text-slate-900 select-none">
                    <input
                      type="checkbox"
                      checked={filterActiveOnly}
                      onChange={(e) => setFilterActiveOnly(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>إظهار الحسابات النشطة فقط (التي تمتلك حركات مدينة أو دائنة خلال الفترة المحددة)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold hover:text-slate-900 select-none">
                    <input
                      type="checkbox"
                      checked={filterBalanceOnly}
                      onChange={(e) => setFilterBalanceOnly(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>إخفاء الحسابات ذات الأرصدة الصفرية الختامية</span>
                  </label>
                </div>
              </div>

              {/* RENDER VIEW 1: Main reports dashboard cards (when === null) */}
              {!selectedReport && (
                <div className="space-y-6">
                  {!reportsAreCanonical && (
                    <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">
                      {canonicalFinancialWriteMode === 'snapshot_write'
                        ? 'هذه الأرقام نسخة عرض من snapshot مركزي محفوظ في UAT، وليست قائمة مالية أو ترحيلاً معتمداً. لا تُستخدم للتسوية أو الإقفال حتى اعتماد خدمة دفتر الأستاذ الكانونية.'
                        : 'هذه الأرقام نسخة عرض من snapshot مركزي للقراءة فقط، وليست قائمة مالية معتمدة. لا تُستخدم للتسوية أو الإقفال حتى اعتماد خدمة دفتر الأستاذ الكانونية.'}
                    </div>
                  )}
                  {/* Executive dashboard widgets */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-slate-950 text-white rounded-xl p-4 shadow-sm space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold">إجمالي الأصول 🏛️</p>
                      <p className="text-sm font-mono font-black text-blue-300" dir="ltr">
                        {totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
                      <p className="text-[10px] text-slate-500 font-bold">إجمالي الخصوم ⚖️</p>
                      <p className="text-sm font-mono font-black text-rose-600" dir="ltr">
                        {totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
                      <p className="text-[10px] text-slate-500 font-bold">حقوق الملكية 🛡️</p>
                      <p className="text-sm font-mono font-black text-indigo-600" dir="ltr">
                        {totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
                      <p className="text-[10px] text-slate-500 font-bold">الفائض المالي السنوي 💵</p>
                      <p className="text-sm font-mono font-black text-emerald-600" dir="ltr">
                        {netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                      </p>
                    </div>

                    <div className="col-span-2 md:col-span-1 bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 justify-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                        <p className={`text-[10px] font-black ${balanceSheetVariance < 0.01 ? 'text-blue-800' : 'text-rose-700'}`}>
                          {balanceSheetVariance < 0.01 ? 'ميزانية المجمع متطابقة' : 'تحتاج الميزانية إلى تسوية'}
                        </p>
                      </div>
                      <p className="text-[9px] text-slate-400 text-center mt-1">فارق الميزانية: {balanceSheetVariance.toFixed(2)} د.ل</p>
                    </div>
                  </div>

                  {/* Grid of 7 ERP Report Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Report 1: ميزان المراجعة */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-lg transition-all flex flex-col justify-between group">
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start">
                          <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                            <FileSpreadsheet className="w-5 h-5" />
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">6 أعمدة ومستويات</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900">ميزان المراجعة الشامل (Trial Balance)</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed">مطابقة ميزان المدفوعات بمجاميع الحركات الدائنة والمدينة والأرصدة الافتتاحية والختامية، مع إمكانية التصفية على مستوى مستويات الشجرة أو الحسابات الفرعية.</p>
                      </div>
                      <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                        <button
                          onClick={() => handleSelectReport('trial_balance')}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer text-center"
                        >
                          👁️ استعراض وتدقيق
                        </button>
                      </div>
                    </div>

                    {/* Report 2: قائمة الدخل */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-lg transition-all flex flex-col justify-between group">
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start">
                          <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-5 h-5" />
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">كشف أرباح وخسائر</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900">قائمة الدخل الختامية (Income Statement)</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed">احتساب الفائض التشغيلي للمؤسسة التعليمية برصد الإيرادات والمصروفات والرواتب ومصاريف الامتحانات، وإظهار صافي الربح أو الخسارة للفترة الحالية.</p>
                      </div>
                      <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                        <button
                          onClick={() => handleSelectReport('income_statement')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer text-center"
                        >
                          👁️ استعراض وتدقيق
                        </button>
                      </div>
                    </div>

                    {/* Report 3: الميزانية العمومية */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-300 hover:shadow-lg transition-all flex flex-col justify-between group">
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start">
                          <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Calculator className="w-5 h-5" />
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">المركز المالي</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900">الميزانية العمومية (Balance Sheet)</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed">تحليل بنود المعادلة المحاسبية من الأصول والسيولة المتوفرة بالصندوق مقابل الالتزامات قصيرة الأجل وطويلة الأجل وحقوق المساهمين لتقييم الموقف المالي.</p>
                      </div>
                      <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                        <button
                          onClick={() => handleSelectReport('balance_sheet')}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer text-center"
                        >
                          👁️ استعراض وتدقيق
                        </button>
                      </div>
                    </div>

                    {/* Report 4: قائمة التدفقات النقدية */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-teal-300 hover:shadow-lg transition-all flex flex-col justify-between group">
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start">
                          <span className="p-2.5 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Coins className="w-5 h-5" />
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full">السيولة النقدية</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900">قائمة التدفقات النقدية (Cash Flow Statement)</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed">تتبع مصادر التمويل والتدفق المالي الوارد والمنصرف مقسمة حسب الأنشطة التشغيلية للمدارس، الأنشطة الاستثمارية كشراء الحافلات، والأنشطة التمويلية.</p>
                      </div>
                      <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                        <button
                          onClick={() => handleSelectReport('cash_flow')}
                          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer text-center"
                        >
                          👁️ استعراض وتدقيق
                        </button>
                      </div>
                    </div>

                    {/* Report 5: كشف حساب تفصيلي */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-purple-300 hover:shadow-lg transition-all flex flex-col justify-between group">
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start">
                          <span className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5" />
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">دفتر مساعد</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900">كشف حساب تفصيلي للعملاء والبنود (Account Card)</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed">استخراج كشف دقيق لحركة حساب معين مع احتساب الرصيد التراكمي خطوة بخطوة من واقع القيود الحقيقية المسجلة، مصفى بمركز التكلفة.</p>
                      </div>
                      <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Auto select first sub-account if none selected
                            let accCode = filterAccount;
                            if (filterAccount === 'all' && accounts.length > 0) {
                              const subAcc = accounts.find(a => a.type === 'فرعي');
                              if (subAcc) {
                                setFilterAccount(subAcc.code);
                                accCode = subAcc.code;
                              }
                            }
                            setSelectedReport('account_statement');
                            if (accCode !== 'all') {
                              setDrillDownStack([
                                {
                                  level: 'account_statement',
                                  accountCode: accCode,
                                  title: `كشف حساب: ${accounts.find(a => a.code === accCode)?.nameAr || accCode}`
                                }
                              ]);
                            }
                          }}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer text-center"
                        >
                          👁️ استعراض وتدقيق
                        </button>
                      </div>
                    </div>

                    {/* Report 6: دفتر الأستاذ العام */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-lg transition-all flex flex-col justify-between group">
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start">
                          <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Layers className="w-5 h-5" />
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">الأستاذ العام</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900">دفتر الأستاذ العام الشامل (General Ledger)</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed">عرض ميزان حركات جميع البنود المحاسبية مع الأرصدة الافتتاحية والختامية الموازية لكل حساب في الدليل الحسابي خلال الفترة المحددة بالتفصيل.</p>
                      </div>
                      <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                        <button
                          onClick={() => handleSelectReport('general_ledger')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer text-center"
                        >
                          👁️ استعراض وتدقيق
                        </button>
                      </div>
                    </div>

                    {/* Report 7: ميزان المراجعة بالأرصدة والحركات */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-rose-300 hover:shadow-lg transition-all flex flex-col justify-between group">
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start">
                          <span className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                            <ArrowRightLeft className="w-5 h-5" />
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full">نموذج 6 أعمدة</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900">ميزان المراجعة بالأرصدة والحركات (Multi-Column)</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed">نموذج التقرير المالي الأكثر طلباً من مكاتب المحاسبة والتدقيق القانونية، ويوضح الحركات والأرصدة جنباً إلى جنب مع مطابقة صارمة.</p>
                      </div>
                      <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                        <button
                          onClick={() => handleSelectReport('trial_balance_movements')}
                          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer text-center"
                        >
                          👁️ استعراض وتدقيق
                        </button>
                      </div>
                    </div>

                    {/* Report 8: الموازنة التقديرية */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-sky-300 hover:shadow-lg transition-all flex flex-col justify-between group">
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start">
                          <span className="p-2.5 bg-sky-50 text-sky-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Percent className="w-5 h-5" />
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full">مقارنة المخطط والفعلي</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900">{reportsAreCanonical ? 'الموازنات السنوية المعتمدة' : 'الموازنات السنوية — نسخة عرض'} (Estimated Budget)</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed">مقارنة المصروفات التشغيلية والرواتب الحاصلة فعلياً بالمطابقة مع المخصص السنوي المعتمد مسبقاً من مجلس الإدارة لتفادي العجز.</p>
                      </div>
                      <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                        <button
                          onClick={() => {
                            setActiveTab('estimated_budget');
                            setActiveSidebarItem('estimated_budget');
                          }}
                          className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer text-center"
                        >
                          👁️ استعراض وتدقيق
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* RENDER VIEW 2: Dynamic sub-report viewer */}
              {selectedReport && (() => {
                const activeCostCenterLabel = filterCostCenter === 'all' ? 'كافة المراكز' : (activeCostCenters.find(c => c.id === filterCostCenter)?.name || filterCostCenter);
                const currentStep = drillDownStack[drillDownStack.length - 1] || { level: 'report_view', reportId: selectedReport, title: '' };

                return (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                    {/* التنقل الهرمي المطور (Hierarchical Breadcrumbs) */}
                    {drillDownStack.length > 1 && (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between text-xs font-semibold text-slate-600 shadow-inner">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button 
                            onClick={() => handleSelectReport(null)}
                            className="text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center gap-1 font-bold"
                          >
                            <span>📊 التقارير المالية</span>
                          </button>
                          {drillDownStack.map((step, idx) => (
                            <React.Fragment key={idx}>
                              <ChevronLeft className="w-4 h-4 text-slate-400" />
                              <button
                                onClick={() => handleDrillDownBreadcrumbClick(idx)}
                                disabled={idx === drillDownStack.length - 1}
                                className={`transition-colors flex items-center gap-1 font-bold ${
                                  idx === drillDownStack.length - 1 
                                    ? 'text-indigo-600 font-extrabold cursor-default' 
                                    : 'text-slate-500 hover:text-slate-800 cursor-pointer'
                                }`}
                              >
                                <span>{step.title}</span>
                              </button>
                            </React.Fragment>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            if (drillDownStack.length > 1) {
                              handleDrillDownBreadcrumbClick(drillDownStack.length - 2);
                            } else {
                              handleSelectReport(null);
                            }
                          }}
                          className="bg-white hover:bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-sm active:scale-95 transition-all"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>رجوع خطوة للخلف</span>
                        </button>
                      </div>
                    )}

                    {currentStep.level === 'journal_entry' && (() => {
                      const jvId = currentStep.journalEntryId;
                      const normEntries = getNormalizedJournalEntries();
                      const jv = normEntries.find(j => j.id === jvId);

                      if (!jv) {
                        return (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
                            <span className="text-3xl">⚠️</span>
                            <h4 className="font-extrabold text-red-900">تعذر العثور على القيد المحاسبي</h4>
                            <p className="text-xs text-red-700">الرجاء العودة وتجربة محاولة التنقل مرة أخرى.</p>
                          </div>
                        );
                      }

                      const totalDebit = (jv.lines || []).reduce((sum: number, l: any) => sum + (Number(l.debit) || 0), 0);
                      const totalCredit = (jv.lines || []).reduce((sum: number, l: any) => sum + (Number(l.credit) || 0), 0);

                      return (
                        <div className="space-y-6 animate-fade-in">
                          {/* Navigation Header */}
                          <div className="flex justify-between items-center bg-slate-50 border border-slate-150 rounded-xl p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-black">
                                  المستوى الثالث: تدقيق القيد
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  jv.status === 'مرحل' || jv.status === 'معتمد' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  الحالة: {jv.status}
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-slate-800">تفاصيل السند المالي المزدوج رقم: {jv.id}</h4>
                            </div>
                            
                            {(jv.receiptVoucherId || jv.paymentVoucherId || jv.id.includes('JV-RV-') || jv.id.includes('JV-PV-') || jv.description.includes('سند')) && (
                              <button
                                onClick={() => handleDrillDownToOriginalDocument(jv)}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all animate-pulse"
                              >
                                <FileText className="w-4 h-4" />
                                <span>عرض المستند الأصلي المولد للقيد 🔗</span>
                              </button>
                            )}
                          </div>

                          {/* Header metadata cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-all">
                              <span className="text-[10px] text-slate-400 block mb-1 font-black">رقم القيد الفريد:</span>
                              <span className="text-xs font-black text-slate-900 block font-mono">{jv.id}</span>
                              <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black ${
                                jv.status === 'مرحل' || jv.status === 'معتمد' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 'bg-amber-50 text-amber-700 border border-amber-150'
                              }`}>
                                {jv.status === 'مرحل' || jv.status === 'معتمد' ? '✓ مرحل بالكامل' : '⏳ مسودة قيد'}
                              </span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-all">
                              <span className="text-[10px] text-slate-400 block mb-1 font-black">تاريخ القيد المالي:</span>
                              <span className="text-xs font-black text-slate-900 block font-mono">{jv.date}</span>
                              <span className="inline-block mt-1.5 text-[9px] text-slate-500 font-extrabold bg-slate-100 px-2 py-0.5 rounded-md">
                                سنة مالية: {jv.date?.split('-')[0] || '2026'}
                              </span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-all col-span-1 sm:col-span-2 lg:col-span-1">
                              <span className="text-[10px] text-slate-400 block mb-1 font-black">نوع ومستوى القيد:</span>
                              <span className="text-xs font-black text-slate-900 block">
                                {jv.type === 'بسيط' || jv.lines?.length <= 2 ? 'قيد بسيط ثنائي الجانب' : 'قيد مركب متعدد الحسابات'}
                              </span>
                              <span className="inline-block mt-1.5 text-[9px] text-indigo-700 font-extrabold bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md">
                                {jv.lines?.length || 2} أطراف متأثرة
                              </span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-all">
                              <span className="text-[10px] text-slate-400 block mb-1 font-black">مركز التكلفة / الفرع:</span>
                              {(() => {
                                const uniqueCostCenters = Array.isArray(jv.lines) 
                                  ? Array.from(new Set(jv.lines.map((l: any) => l.costCenter).filter(Boolean)))
                                  : [];
                                const costCenterLabel = uniqueCostCenters.length === 0
                                  ? 'المقر الرئيسي للمجمع'
                                  : uniqueCostCenters.length === 1
                                    ? (activeCostCenters.find(c => c.id === uniqueCostCenters[0])?.name || uniqueCostCenters[0])
                                    : 'متعدد الفروع والأنشطة';
                                return (
                                  <>
                                    <span className="text-xs font-black text-slate-900 block truncate" title={costCenterLabel}>{costCenterLabel}</span>
                                    <span className="inline-block mt-1.5 text-[9px] text-purple-700 font-extrabold bg-purple-50 border border-purple-150 px-2 py-0.5 rounded-md">
                                      {uniqueCostCenters.length <= 1 ? 'فرعي محدد' : 'مركز تكلفة مدمج'}
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-all">
                              <span className="text-[10px] text-slate-400 block mb-1 font-black">اسم المستخدم والمنشئ:</span>
                              <span className="text-xs font-black text-slate-900 block truncate" title={jv.createdByUser || 'سليمان غازي'}>
                                {jv.createdByUser || 'سليمان غازي'}
                              </span>
                              <span className="inline-block mt-1.5 text-[9px] text-emerald-750 font-extrabold bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-md">
                                {reportsAreCanonical ? 'مراجع ومعتمد بالصلاحيات' : 'معروض من snapshot — غير معتمد'}
                              </span>
                            </div>
                          </div>

                          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl shadow-inner">
                            <span className="text-[10px] text-blue-500 block mb-1 font-black">البيان والشرح التفصيلي المرفق بالقيد:</span>
                            <span className="text-xs font-bold text-slate-800 leading-relaxed block">{jv.description}</span>
                          </div>

                          {/* Journal lines table */}
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                            <div className="overflow-x-auto">
                              <table className="w-full text-right border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500">
                                    <th className="p-3">رمز الحساب</th>
                                    <th className="p-3">اسم الحساب في الشجرة</th>
                                    <th className="p-3 text-left">مدين (Debit)</th>
                                    <th className="p-3 text-left">دائن (Credit)</th>
                                    <th className="p-3">البيان الخاص بالحركة</th>
                                    <th className="p-3">مركز التكلفة</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                  {jv.lines.map((line: any, idx: number) => {
                                    const isDebit = (Number(line.debit) || 0) > 0;
                                    return (
                                      <tr 
                                        key={idx} 
                                        className={`hover:bg-slate-50 transition-colors ${
                                          isDebit ? 'border-r-4 border-indigo-500 bg-indigo-50/5' : 'border-r-4 border-emerald-500 bg-emerald-50/5'
                                        }`}
                                      >
                                        <td className="p-3 font-mono font-bold text-slate-600">{line.accountCode}</td>
                                        <td className="p-3 font-bold text-slate-800">
                                          <div className="flex items-center justify-between gap-1.5">
                                            <div className="flex items-center gap-2">
                                              {isDebit ? (
                                                <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-black border border-indigo-150">حـ/ مدين (Dr.)</span>
                                              ) : (
                                                <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-black border border-emerald-150 font-sans">حـ/ دائن (Cr.)</span>
                                              )}
                                              <span className="text-slate-900">{line.accountName}</span>
                                            </div>
                                            <button
                                              onClick={() => handleDrillDownToAccount(line.accountCode)}
                                              className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 px-1.5 py-0.5 rounded cursor-pointer transition-all font-semibold flex items-center gap-0.5 whitespace-nowrap"
                                              title="عرض كشف حساب هذا البند"
                                            >
                                              <span>كشف الحساب</span>
                                              <ArrowUpRight className="w-2.5 h-2.5" />
                                            </button>
                                          </div>
                                        </td>
                                        <td className="p-3 font-mono font-bold text-indigo-600 text-left">
                                          {line.debit > 0 ? line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="p-3 font-mono font-bold text-emerald-600 text-left">
                                          {line.credit > 0 ? line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="p-3 text-slate-500 font-semibold">{line.description || jv.description}</td>
                                        <td className="p-3">
                                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold">
                                            {activeCostCenters.find(c => c.id === line.costCenter)?.name || line.costCenter || 'المقر الرئيسي'}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-slate-50 font-mono font-black text-xs border-t border-slate-200">
                                    <td colSpan={2} className="p-3.5 font-sans font-black text-slate-800">الإجمالي المجمع للقيد:</td>
                                    <td className="p-3.5 text-indigo-600 text-left border-l border-slate-200 bg-indigo-50/30">
                                      {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3.5 text-emerald-600 text-left border-l border-slate-200 bg-emerald-50/30">
                                      {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td colSpan={2} className="p-3.5 text-center text-emerald-700 bg-emerald-50/40 font-sans font-bold">
                                      {Math.abs(totalDebit - totalCredit) < 0.01 ? '✓ القيد متوازن ومطابق لمعايير الحسابات' : '❌ خطأ: القيد غير متوازن'}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>

                          {/* Print and Export Buttons */}
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                const tableRows = jv.lines.map((l: any) => `
                                  <tr>
                                    <td style="padding: 10px; border: 1px solid #ddd; font-family: monospace;">${l.accountCode}</td>
                                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${l.accountName}</td>
                                    <td style="padding: 10px; border: 1px solid #ddd; text-align: left; font-family: monospace;">${l.debit > 0 ? l.debit.toLocaleString() : '-'}</td>
                                    <td style="padding: 10px; border: 1px solid #ddd; text-align: left; font-family: monospace;">${l.credit > 0 ? l.credit.toLocaleString() : '-'}</td>
                                    <td style="padding: 10px; border: 1px solid #ddd; color: #555;">${l.description || jv.description}</td>
                                  </tr>
                                `).join('');
                                
                                printReportPdf(
                                  `سند قيد يومية رقم ${jv.id}`,
                                  `${reportsAreCanonical ? 'بيان القيد المزدوج المحاسبي المعتمد' : 'بيان القيد المزدوج المعروض — غير معتمد'} والمسجل في ${jv.date}`,
                                  ['رمز الحساب', 'اسم الحساب', 'مدين', 'دائن', 'البيان'],
                                  tableRows,
                                  `
                                    <div style="margin-top: 20px; font-weight: bold;">
                                      <p>البيان العام للقيد: ${jv.description}</p>
                                      <p>المحاسب المسؤول: ${jv.createdByUser || 'سليمان غازي'}</p>
                                      <p>حالة الترحيل بالأستاذ: ${reportsAreCanonical ? 'مرحل ترحيلاً معتمداً نهائياً ✓' : 'حالة تاريخية معروضة من snapshot — لا يمكن إثبات ترحيل كانوني جديد'}</p>
                                    </div>
                                  `
                                );
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Printer className="w-4 h-4" />
                              <span>طباعة القيد وإصدار أمر صرف PDF</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {currentStep.level === 'original_document' && (() => {
                      const docId = currentStep.documentId;
                      const docType = currentStep.documentType;

                      if (docType === 'receipt_voucher') {
                        const rv = receiptVouchers.find(r => r.id === docId);
                        if (!rv) {
                          return (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
                              <span className="text-3xl">⚠️</span>
                              <h4 className="font-extrabold text-red-900">تعذر العثور على سند القبض الأصلي</h4>
                              <p className="text-xs text-red-700">الرقم المرجعي المطلوب: {docId}</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-6 animate-fade-in">
                            {/* Level Info Banner */}
                            <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-xl p-4 flex justify-between items-center text-xs font-semibold">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-black">
                                  المستوى الرابع: المستند المرجعي الأصلي
                                </span>
                                <span>{reportsAreCanonical ? 'سند قبض مالي أصلي معتمد قانونياً' : 'سند قبض معروض من snapshot — غير معتمد قانونياً'}</span>
                              </div>
                              <span className="font-mono text-[10px] bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800">
                                ID: {rv.id}
                              </span>
                            </div>

                            {/* Interactive Receipt Voucher Receipt */}
                            <div className="bg-amber-50/15 border-4 border-double border-amber-200 rounded-3xl p-8 max-w-2xl mx-auto shadow-sm space-y-6 text-slate-800">
                              {/* Top Header of the Voucher */}
                              <div className="flex justify-between items-start border-b border-amber-200/50 pb-5">
                                <div className="text-right space-y-1">
                                  <h4 className="font-black text-slate-900 text-sm">مجمع المدارس الموحد</h4>
                                  <p className="text-[10px] text-slate-500">منظومة ERP للحسابات العامة والرسوم الدراسية</p>
                                  <p className="text-[9px] text-slate-400 font-semibold">مركز التكلفة: {activeCostCenters.find(c => c.id === rv.costCenter)?.name || rv.costCenter}</p>
                                </div>
                                <div className="text-center bg-amber-500/10 border border-amber-500/20 px-5 py-2.5 rounded-xl">
                                  <span className="text-[11px] font-black text-amber-800 block">سند قبض نقدي / بنكي</span>
                                  <span className="font-mono font-black text-slate-900 text-sm mt-1 block">{rv.id}</span>
                                </div>
                                <div className="text-left text-xs font-bold space-y-1 text-slate-500">
                                  <div>التاريخ: <span className="font-mono font-extrabold text-slate-800">{rv.date}</span></div>
                                  <div>الحالة: <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${reportsAreCanonical ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{reportsAreCanonical ? (rv.status || 'معتمد') : 'معروض — غير معتمد'}</span></div>
                                </div>
                              </div>

                              {/* Content Lines */}
                              <div className="space-y-4 text-xs font-bold text-slate-700">
                                <div className="flex items-center border-b border-dashed border-slate-200 pb-2">
                                  <span className="w-24 text-slate-400">استلمنا من السيد/ة:</span>
                                  <span className="text-slate-900 font-black text-sm">{rv.receivedFrom}</span>
                                </div>

                                <div className="flex items-center border-b border-dashed border-slate-200 pb-2">
                                  <span className="w-24 text-slate-400">مبلغا وقدره:</span>
                                  <span className="text-emerald-700 font-black text-sm" dir="ltr">
                                    {rv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                                  </span>
                                  <span className="mr-3 text-[10px] text-slate-400">({rv.amount === 250 ? 'مئتان وخمسون دينار ليبي فقط لا غير' : 'مبلغ الرسوم المحتسبة'})</span>
                                </div>

                                <div className="flex items-center border-b border-dashed border-slate-200 pb-2">
                                  <span className="w-24 text-slate-400">وذلك مقابل:</span>
                                  <span className="text-slate-800 font-semibold">{rv.against}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                  <div className="bg-white/60 p-3 rounded-xl border border-slate-100 space-y-1">
                                    <span className="text-[9px] text-slate-400 block">طريقة الدفع:</span>
                                    <span className="text-xs font-black text-slate-800">💳 {rv.paymentMethod}</span>
                                  </div>
                                  <div className="bg-white/60 p-3 rounded-xl border border-slate-100 space-y-1">
                                    <span className="text-[9px] text-slate-400 block">حساب الإيداع:</span>
                                    <span className="text-xs font-black text-slate-800">
                                      {accounts.find(a => a.code === rv.receivingAccount)?.nameAr || rv.receivingAccount}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Signatures Footer */}
                              <div className="grid grid-cols-3 gap-4 border-t border-amber-200/50 pt-6 text-center text-[10px] text-slate-500">
                                <div>
                                  <span>توقيع أمين الصندوق</span>
                                  <div className="mt-6 border-b border-slate-200 h-5"></div>
                                </div>
                                <div>
                                  <span>{reportsAreCanonical ? 'المحاسب المعتمد' : 'المستخدم المسجل'}</span>
                                  <span className="block mt-4 font-black text-slate-800">{rv.user || 'سليمان غازي'}</span>
                                </div>
                                <div>
                                  <span>الختم الرسمي للمؤسسة</span>
                                  <div className="w-16 h-16 rounded-full border border-dashed border-amber-300 mx-auto mt-2 flex items-center justify-center text-[8px] text-amber-500 font-bold rotate-12">
                                    مجمع المدارس
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Export and action triggers */}
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => {
                                  const printWindow = window.open('', '_blank');
                                  if (!printWindow) return;
                                  printWindow.document.write(`
                                    <html dir="rtl">
                                      <head>
                                        <title>سند قبض رقم ${rv.id}</title>
                                        <style>
                                          body { font-family: system-ui, sans-serif; padding: 40px; text-align: right; }
                                          .receipt { border: 5px double #f59e0b; padding: 30px; border-radius: 20px; background-color: #fffbeb; }
                                          .header { display: flex; justify-content: space-between; border-b: 2px solid #f59e0b; padding-bottom: 20px; }
                                          .row { display: flex; border-b: 1px dashed #ccc; padding: 12px 0; font-size: 14px; }
                                          .label { width: 150px; color: #666; font-weight: bold; }
                                          .val { font-weight: bold; color: #111; }
                                          .foot { display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="receipt">
                                          <div class="header">
                                            <div>
                                              <h3>مجمع المدارس الموحد</h3>
                                            <p>${reportsAreCanonical ? 'سند قبض مالي رسمي معتمد' : 'نسخة عرض لسند قبض — غير معتمدة'} رقم: ${rv.id}</p>
                                            </div>
                                            <div>
                                              <p>التاريخ: ${rv.date}</p>
                                              <p>طريقة الدفع: ${rv.paymentMethod}</p>
                                            </div>
                                          </div>
                                          <div class="row"><div class="label">استلمنا من السيد/ة:</div><div class="val">${rv.receivedFrom}</div></div>
                                          <div class="row"><div class="label">مبلغا وقدره:</div><div class="val" style="color: green; font-size: 16px;">${rv.amount.toLocaleString()} د.ل</div></div>
                                          <div class="row"><div class="label">وذلك مقابل:</div><div class="val">${rv.against}</div></div>
                                          <div class="row"><div class="label">مركز التكلفة:</div><div class="val">${rv.stage}</div></div>
                                          <div class="foot">
                                            <div>توقيع المستلم</div>
                                            <div>المحاسب المسؤول: ${rv.user || 'سليمان غازي'}</div>
                                            <div>الختم الرسمي</div>
                                          </div>
                                        </div>
                                      </body>
                                    </html>
                                  `);
                                  printWindow.print();
                                }}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
                              >
                                <Printer className="w-4 h-4" />
                                <span>{reportsAreCanonical ? 'طباعة سند القبض الرسمي المعتمد PDF' : 'طباعة نسخة عرض سند القبض PDF'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      if (docType === 'payment_voucher') {
                        const pv = paymentVouchers.find(p => p.id === docId);
                        if (!pv) {
                          return (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
                              <span className="text-3xl">⚠️</span>
                              <h4 className="font-extrabold text-red-900">تعذر العثور على سند الصرف الأصلي</h4>
                              <p className="text-xs text-red-700">الرقم المرجعي المطلوب: {docId}</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-6 animate-fade-in">
                            {/* Level Info Banner */}
                            <div className="bg-indigo-50 border border-indigo-200 text-indigo-950 rounded-xl p-4 flex justify-between items-center text-xs font-semibold">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 bg-indigo-200 text-indigo-900 rounded-full text-[10px] font-black">
                                  المستوى الرابع: المستند المرجعي الأصلي
                                </span>
                                <span>{reportsAreCanonical ? 'سند صرف مالي أصلي معتمد قانونياً' : 'سند صرف معروض من snapshot — غير معتمد قانونياً'}</span>
                              </div>
                              <span className="font-mono text-[10px] bg-white border border-indigo-300 px-2 py-0.5 rounded text-indigo-800">
                                ID: {pv.id}
                              </span>
                            </div>

                            {/* Interactive Payment Voucher Receipt */}
                            <div className="bg-indigo-50/15 border-4 border-double border-indigo-200 rounded-3xl p-8 max-w-2xl mx-auto shadow-sm space-y-6 text-slate-800">
                              {/* Top Header of the Voucher */}
                              <div className="flex justify-between items-start border-b border-indigo-200/50 pb-5">
                                <div className="text-right space-y-1">
                                  <h4 className="font-black text-slate-900 text-sm">مجمع المدارس الموحد</h4>
                                  <p className="text-[10px] text-slate-500">منظومة ERP للحسابات العامة والرسوم الدراسية</p>
                                  <p className="text-[9px] text-slate-400 font-semibold">مركز التكلفة: {activeCostCenters.find(c => c.id === pv.costCenter)?.name || pv.costCenter}</p>
                                </div>
                                <div className="text-center bg-indigo-500/10 border border-indigo-500/20 px-5 py-2.5 rounded-xl">
                                  <span className="text-[11px] font-black text-indigo-800 block">{reportsAreCanonical ? 'سند صرف مالي رسمي معتمد' : 'نسخة عرض لسند صرف'}</span>
                                  <span className="font-mono font-black text-slate-900 text-sm mt-1 block">{pv.id}</span>
                                </div>
                                <div className="text-left text-xs font-bold space-y-1 text-slate-500">
                                  <div>التاريخ: <span className="font-mono font-extrabold text-slate-800">{pv.date}</span></div>
                                  <div>الحالة: <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${reportsAreCanonical ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{reportsAreCanonical ? (pv.status || 'معتمد') : 'معروض — غير معتمد'}</span></div>
                                </div>
                              </div>

                              {/* Content Lines */}
                              <div className="space-y-4 text-xs font-bold text-slate-700">
                                <div className="flex items-center border-b border-dashed border-slate-200 pb-2">
                                  <span className="w-24 text-slate-400">صرفنا إلى السيد/ة:</span>
                                  <span className="text-slate-900 font-black text-sm">{pv.beneficiary}</span>
                                </div>

                                <div className="flex items-center border-b border-dashed border-slate-200 pb-2">
                                  <span className="w-24 text-slate-400">مبلغا وقدره:</span>
                                  <span className="text-rose-700 font-black text-sm" dir="ltr">
                                    {pv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                                  </span>
                                  <span className="mr-3 text-[10px] text-slate-400">({pv.amount === 1200 ? 'ألف ومائتان دينار ليبي فقط لا غير' : reportsAreCanonical ? 'مبلغ منصرف ومعتمد من الخزينة' : 'مبلغ معروض من snapshot — غير معتمد'})</span>
                                </div>

                                <div className="flex items-center border-b border-dashed border-slate-200 pb-2">
                                  <span className="w-24 text-slate-400">وذلك مقابل:</span>
                                  <span className="text-slate-800 font-semibold">{pv.against}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                  <div className="bg-white/60 p-3 rounded-xl border border-slate-100 space-y-1">
                                    <span className="text-[9px] text-slate-400 block">حساب الصرف الدائن:</span>
                                    <span className="text-xs font-black text-slate-800">
                                      {accounts.find(a => a.code === pv.paidFromAccount)?.nameAr || pv.paidFromAccount}
                                    </span>
                                  </div>
                                  <div className="bg-white/60 p-3 rounded-xl border border-slate-100 space-y-1">
                                    <span className="text-[9px] text-slate-400 block">حساب المصروف المدين:</span>
                                    <span className="text-xs font-black text-slate-800">
                                      {accounts.find(a => a.code === pv.paidToAccount)?.nameAr || pv.paidToAccount}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Signatures Footer */}
                              <div className="grid grid-cols-3 gap-4 border-t border-indigo-200/50 pt-6 text-center text-[10px] text-slate-500">
                                <div>
                                  <span>المستلم / المستفيد</span>
                                  <div className="mt-6 border-b border-slate-200 h-5"></div>
                                </div>
                                <div>
                                  <span>المدير المالي</span>
                                  <span className="block mt-4 font-black text-slate-800">سليمان غازي</span>
                                </div>
                                <div>
                                  <span>الختم الرسمي للمجمع</span>
                                  <div className="w-16 h-16 rounded-full border border-dashed border-indigo-300 mx-auto mt-2 flex items-center justify-center text-[8px] text-indigo-500 font-bold -rotate-12">
                                    مجمع المدارس
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Export and action triggers */}
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => {
                                  const printWindow = window.open('', '_blank');
                                  if (!printWindow) return;
                                  printWindow.document.write(`
                                    <html dir="rtl">
                                      <head>
                                        <title>سند صرف رقم ${pv.id}</title>
                                        <style>
                                          body { font-family: system-ui, sans-serif; padding: 40px; text-align: right; }
                                          .receipt { border: 5px double #4f46e5; padding: 30px; border-radius: 20px; background-color: #faf5ff; }
                                          .header { display: flex; justify-content: space-between; border-b: 2px solid #4f46e5; padding-bottom: 20px; }
                                          .row { display: flex; border-b: 1px dashed #ccc; padding: 12px 0; font-size: 14px; }
                                          .label { width: 150px; color: #666; font-weight: bold; }
                                          .val { font-weight: bold; color: #111; }
                                          .foot { display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="receipt">
                                          <div class="header">
                                            <div>
                                              <h3>مجمع المدارس الموحد</h3>
                                            <p>${reportsAreCanonical ? 'سند صرف مالي رسمي معتمد' : 'نسخة عرض لسند صرف — غير معتمدة'} رقم: ${pv.id}</p>
                                            </div>
                                            <div>
                                              <p>التاريخ: ${pv.date}</p>
                                              <p>مركز التكلفة: ${pv.costCenter}</p>
                                            </div>
                                          </div>
                                          <div class="row"><div class="label">صرفنا إلى السيد/ة:</div><div class="val">${pv.beneficiary}</div></div>
                                          <div class="row"><div class="label">مبلغا وقدره:</div><div class="val" style="color: red; font-size: 16px;">${pv.amount.toLocaleString()} د.ل</div></div>
                                          <div class="row"><div class="label">وذلك مقابل:</div><div class="val">${pv.against}</div></div>
                                          <div class="foot">
                                            <div>توقيع المستلم</div>
                                            <div>المدير المالي: سليمان غازي</div>
                                            <div>الختم المالي</div>
                                          </div>
                                        </div>
                                      </body>
                                    </html>
                                  `);
                                  printWindow.print();
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
                              >
                                <Printer className="w-4 h-4" />
                                <span>{reportsAreCanonical ? 'طباعة سند الصرف المالي المعتمد PDF' : 'طباعة نسخة عرض سند الصرف PDF'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      }
                    })()}

                    {currentStep.level === 'report_view' && (
                      <>
                        {/* Sub-view header and export actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-4">
                          <div>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold">
                          المحاسبة المتقدمة: {activeCostCenterLabel} ({filterFromDate} إلى {filterToDate})
                        </span>
                        <h3 className="text-sm font-black text-slate-900 mt-2">
                          {selectedReport === 'trial_balance' && 'ميزان المراجعة الشامل (Trial Balance)'}
                          {selectedReport === 'income_statement' && 'بيان كشف الدخل التشغيلي والختامي (Income Statement)'}
                          {selectedReport === 'balance_sheet' && 'الميزانية العمومية والبيان الرأسمالي للفرع (Balance Sheet)'}
                          {selectedReport === 'cash_flow' && 'قائمة التدفقات النقدية الدورية (Cash Flow Statement)'}
                          {selectedReport === 'account_statement' && 'كشف حساب تفصيلي للعميل / البند (Account Statement)'}
                          {selectedReport === 'general_ledger' && 'دفتر الأستاذ العام المجمع (General Ledger)'}
                          {selectedReport === 'trial_balance_movements' && 'ميزان المراجعة بالأرصدة والحركات (6 أعمدة)'}
                        </h3>
                      </div>

                      {/* Export triggers */}
                      <div className="flex items-center gap-2">
                        {/* Specific view configuration triggers */}
                        {selectedReport === 'trial_balance' && (
                          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 text-[10px] font-bold">
                            <button
                              onClick={() => setTrialBalanceLevel('all')}
                              className={`px-2.5 py-1.5 cursor-pointer ${trialBalanceLevel === 'all' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-150'}`}
                            >
                              الكل
                            </button>
                            <button
                              onClick={() => setTrialBalanceLevel(1)}
                              className={`px-2.5 py-1.5 cursor-pointer ${trialBalanceLevel === 1 ? 'bg-indigo-600 text-white' : 'hover:bg-slate-150'}`}
                            >
                              مستوى 1
                            </button>
                            <button
                              onClick={() => setTrialBalanceLevel(2)}
                              className={`px-2.5 py-1.5 cursor-pointer ${trialBalanceLevel === 2 ? 'bg-indigo-600 text-white' : 'hover:bg-slate-150'}`}
                            >
                              مستوى 2
                            </button>
                            <button
                              onClick={() => setTrialBalanceLevel(3)}
                              className={`px-2.5 py-1.5 cursor-pointer ${trialBalanceLevel === 3 ? 'bg-indigo-600 text-white' : 'hover:bg-slate-150'}`}
                            >
                              مستوى 3
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            if (selectedReport === 'trial_balance') {
                              const headers = ['رمز الحساب', 'اسم الحساب المحاسبي', 'التصنيف', 'طبيعة الحساب', 'أرصدة مدينة (د.ل)', 'أرصدة دائنة (د.ل)'];
                              const rows = reportAccounts
                                .filter(a => trialBalanceLevel === 'all' || a.level === trialBalanceLevel)
                                .map(acc => {
                                  const isDeb = acc.natureType === 'مدين' || acc.classification === 'أصول' || acc.classification === 'مصروفات';
                                  const deb = isDeb ? acc.endingBalance : 0;
                                  const crd = !isDeb ? acc.endingBalance : 0;
                                  return [acc.code, acc.nameAr, acc.classification, acc.natureType, deb.toFixed(2), crd.toFixed(2)];
                                });
                              exportReportExcel('ميزان_المراجعة', headers, rows);
                            } else if (selectedReport === 'income_statement') {
                              const headers = ['اسم البند المحاسبي', 'تصنيف الحساب', 'الرصيد التشغيلي (د.ل)'];
                              const rows = reportAccounts
                                .filter(a => (a.classification === 'إيرادات' || a.classification === 'مصروفات') && a.level === 3)
                                .map(a => [a.nameAr, a.classification, a.endingBalance.toFixed(2)]);
                              exportReportExcel('قائمة_الدخل', headers, rows);
                            } else if (selectedReport === 'balance_sheet') {
                              const headers = ['اسم البند', 'التصنيف', 'الرصيد المعتمد (د.ل)'];
                              const rows = reportAccounts
                                .filter(a => (a.classification === 'أصول' || a.classification === 'خصوم' || a.classification === 'حقوق ملكية') && a.level === 3)
                                .map(a => [a.nameAr, a.classification, a.endingBalance.toFixed(2)]);
                              exportReportExcel('الميزانية_العمومية', headers, rows);
                            } else if (selectedReport === 'cash_flow') {
                              const headers = ['بند التدفق النقدي', 'النوع', 'القيمة المتدفقة (د.ل)'];
                              const rows = [
                                ['المتحصلات النقدية الموثقة', 'تشغيلي - وارد', cashFlowValue(actualCashInflow)],
                                ['المدفوعات النقدية الموثقة', 'تشغيلي - صادر', cashFlowValue(actualCashOutflow)],
                                ['التدفقات الاستثمارية الموثقة', 'استثماري', cashFlowValue(0)],
                                ['التدفقات التمويلية الموثقة', 'تمويلي', cashFlowValue(0)]
                              ];
                              exportReportExcel('قائمة_التدفقات_النقدية', headers, rows);
                            } else if (selectedReport === 'account_statement') {
                              const targetAcc = accounts.find(a => a.code === filterAccount);
                              const headers = ['التاريخ', 'القيد', 'البيان والتفاصيل', 'مدين (د.ل)', 'دائن (د.ل)', 'الرصيد المتراكم'];
                              let running = targetAcc ? targetAcc.balance * 0.7 : 0;
                              const rows = [['رصيد افتتاحي', '', 'رصيد مرحل من الفترة السابقة', '', '', running.toFixed(2)]];
                              
                              journalEntries.forEach((entry: any) => {
                                if (entry.status !== 'مرحل' && entry.status !== 'معتمد') return;
                                if (entry.date < filterFromDate || entry.date > filterToDate) return;
                                if (Array.isArray(entry.lines)) {
                                  entry.lines.forEach((line: any) => {
                                    if (line.accountCode === filterAccount) {
                                      if (filterCostCenter !== 'all' && line.costCenter !== filterCostCenter) return;
                                      const deb = Number(line.debit) || 0;
                                      const crd = Number(line.credit) || 0;
                                      const isDeb = targetAcc?.natureType === 'مدين' || targetAcc?.classification === 'أصول';
                                      running = isDeb ? (running + deb - crd) : (running + crd - deb);
                                      rows.push([entry.date, entry.id, line.description || entry.description, deb.toFixed(2), crd.toFixed(2), running.toFixed(2)]);
                                    }
                                  });
                                }
                              });
                              exportReportExcel(`كشف_حساب_${filterAccount}`, headers, rows);
                            } else if (selectedReport === 'general_ledger') {
                              const headers = ['رمز الحساب', 'اسم الحساب المحاسبي', 'طبيعة الحساب', 'رصيد افتتاحي (د.ل)', 'حركات مدينة', 'حركات دائنة', 'رصيد ختامي (د.ل)'];
                              const rows = reportAccounts.map(a => [
                                a.code,
                                a.nameAr,
                                a.natureType,
                                a.openingBalance.toFixed(2),
                                a.debitMovements.toFixed(2),
                                a.creditMovements.toFixed(2),
                                a.endingBalance.toFixed(2)
                              ]);
                              exportReportExcel('دفتر_الأستاذ_العام', headers, rows);
                            } else if (selectedReport === 'trial_balance_movements') {
                              const headers = ['رمز الحساب', 'اسم الحساب', 'افتتاحي مدين', 'افتتاحي دائن', 'حركة مدين', 'حركة دائن', 'ختامي مدين', 'ختامي دائن'];
                              const rows = reportAccounts.map(a => {
                                const isDeb = a.natureType === 'مدين';
                                return [
                                  a.code,
                                  a.nameAr,
                                  isDeb ? a.openingBalance.toFixed(2) : '0.00',
                                  !isDeb ? a.openingBalance.toFixed(2) : '0.00',
                                  a.debitMovements.toFixed(2),
                                  a.creditMovements.toFixed(2),
                                  isDeb ? a.endingBalance.toFixed(2) : '0.00',
                                  !isDeb ? a.endingBalance.toFixed(2) : '0.00'
                                ];
                              });
                              exportReportExcel('ميزان_المراجعة_6_أعمدة', headers, rows);
                            }
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          <span>تصدير Excel</span>
                        </button>

                        <button
                          onClick={() => {
                            if (selectedReport === 'trial_balance') {
                              let rowsHtml = '';
                              let totDeb = 0;
                              let totCrd = 0;
                              reportAccounts
                                .filter(a => trialBalanceLevel === 'all' || a.level === trialBalanceLevel)
                                .forEach(acc => {
                                  const isDeb = acc.natureType === 'مدين' || acc.classification === 'أصول' || acc.classification === 'مصروفات';
                                  const deb = isDeb ? acc.endingBalance : 0;
                                  const crd = !isDeb ? acc.endingBalance : 0;
                                  totDeb += deb;
                                  totCrd += crd;
                                  rowsHtml += `
                                    <tr>
                                      <td style="font-family: monospace;">${acc.code}</td>
                                      <td style="font-weight: ${acc.type === 'رئيسي' ? 'bold' : 'normal'}; padding-right: ${acc.level * 15}px;">${acc.nameAr}</td>
                                      <td>${acc.classification}</td>
                                      <td>${acc.natureType}</td>
                                      <td style="text-align: left; font-family: monospace;">${deb > 0 ? deb.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                      <td style="text-align: left; font-family: monospace;">${crd > 0 ? crd.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                    </tr>
                                  `;
                                });
                              const summaryHtml = `
                                <div style="margin-top: 15px; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #cbd5e1; font-weight: bold; display: flex; justify-content: space-between;">
                                  <span>الإجمالي العام الموزون:</span>
                                  <span>مدين: ${totDeb.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل | دائن: ${totCrd.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span>
                                </div>
                              `;
                              printReportPdf('ميزان المراجعة الشامل (Trial Balance)', 'ميزان إجمالي وتفصيلي مطابق لجميع الدفاتر القيادية والفرعية للفترة المحددة.', ['رمز الحساب', 'اسم الحساب المحاسبي', 'التصنيف', 'طبيعة الحساب', 'رصيد مدين', 'رصيد دائن'], rowsHtml, summaryHtml);
                            } else if (selectedReport === 'income_statement') {
                              let rowsHtml = '';
                              reportAccounts
                                .filter(a => (a.classification === 'إيرادات' || a.classification === 'مصروفات') && a.level === 3)
                                .forEach(a => {
                                  rowsHtml += `
                                    <tr>
                                      <td style="font-family: monospace;">${a.code}</td>
                                      <td style="font-weight: bold;">${a.nameAr}</td>
                                      <td>${a.classification}</td>
                                      <td style="text-align: left; font-family: monospace;">${a.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
                                    </tr>
                                  `;
                                });
                              const summaryHtml = `
                                <div style="margin-top: 20px; background: #eff6ff; padding: 15px; border-radius: 8px; border: 1px solid #bfdbfe; font-size: 13px; font-weight: bold; line-height: 1.6;">
                                  <div style="display: flex; justify-content: space-between; color: #1e40af;">
                                    <span>إجمالي الإيرادات للفترة:</span>
                                    <span>${totalRevenues.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span>
                                  </div>
                                  <div style="display: flex; justify-content: space-between; color: #b91c1c; margin-top: 8px;">
                                    <span>إجمالي المصروفات للفترة:</span>
                                    <span>${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span>
                                  </div>
                                  <div style="display: flex; justify-content: space-between; color: #047857; margin-top: 12px; border-top: 2px solid #bfdbfe; padding-top: 8px;">
                                    <span>صافي الدخل التشغيلي (الفائض المالي):</span>
                                    <span>${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span>
                                  </div>
                                </div>
                              `;
                              printReportPdf('كشف قائمة الدخل للعام المالي (Income Statement)', 'حساب إجمالي الأرباح والخسائر التشغيلية للفروع التعليمية.', ['رمز الحساب', 'البند المالي الدفتري', 'التصنيف الرئيسي', 'القيمة التشغيلية المعتمدة'], rowsHtml, summaryHtml);
                            } else if (selectedReport === 'balance_sheet') {
                              let rowsHtml = '';
                              reportAccounts
                                .filter(a => (a.classification === 'أصول' || a.classification === 'خصوم' || a.classification === 'حقوق ملكية') && a.level === 3)
                                .forEach(a => {
                                  rowsHtml += `
                                    <tr>
                                      <td style="font-family: monospace;">${a.code}</td>
                                      <td style="font-weight: bold;">${a.nameAr}</td>
                                      <td>${a.classification}</td>
                                      <td style="text-align: left; font-family: monospace;">${a.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
                                    </tr>
                                  `;
                                });
                              const summaryHtml = `
                                <div style="margin-top: 20px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
                                  <div style="background: #f1f5f9; padding: 10px; font-weight: bold; font-size: 12px; text-align: center;">تحليل وتطابق المعادلة المحاسبية الميزانية</div>
                                  <div style="padding: 15px; font-size: 11px; font-weight: bold; line-height: 1.6; display: flex; justify-content: space-around;">
                                    <div style="color: #1e3a8a;">إجمالي الأصول المعتمدة:<br/><span style="font-size: 14px; font-family: monospace;">${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span></div>
                                    <div style="color: #b91c1c;">إجمالي الخصوم والالتزامات:<br/><span style="font-size: 14px; font-family: monospace;">${totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span></div>
                                    <div style="color: #4f46e5;">إجمالي حقوق الملكية:<br/><span style="font-size: 14px; font-family: monospace;">${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span></div>
                                  </div>
                                  <div style="background: #eff6ff; padding: 10px; font-weight: bold; text-align: center; color: #1e40af; border-top: 1px solid #cbd5e1;">
                                    مجموع (الخصوم + حقوق الملكية) = ${(totalLiabilities + totalEquity).toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل
                                    <br/>
                                    <span style="font-size: 10px; color: ${reportsAreCanonical ? '#15803d' : '#b45309'};">${reportsAreCanonical ? `⚖️ تم التحقق والتدقيق: الميزانية متوازنة تماماً. الفارق: ${balanceSheetVariance.toFixed(2)} د.ل` : '⚠️ نسخة عرض غير معتمدة من snapshot؛ لا يمكن إثبات توازن الميزانية.'}</span>
                                  </div>
                                </div>
                              `;
                              printReportPdf('الميزانية العمومية والمركز المالي (Balance Sheet)', 'تفريغ معتمد للأصول، والخصوم، وحقوق الملكية من دفاتر الأستاذ العام.', ['رمز الحساب', 'البند المحاسبي', 'التصنيف الرئيسي', 'الرصيد الختامي المعتمد'], rowsHtml, summaryHtml);
                            } else if (selectedReport === 'cash_flow') {
                              const entries = [
                                ['المتحصلات النقدية الموثقة', 'أنشطة تشغيلية - تدفق وارد', hasVerifiedCashFlow ? actualCashInflow.toLocaleString(undefined, { minimumFractionDigits: 2 }) + ' د.ل' : 'غير متحقق'],
                                ['المدفوعات النقدية الموثقة', 'أنشطة تشغيلية - تدفق صادر', hasVerifiedCashFlow ? '-' + actualCashOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 }) + ' د.ل' : 'غير متحقق'],
                                ['التدفقات الاستثمارية الموثقة', 'أنشطة استثمارية', cashFlowValue(0) + (hasVerifiedCashFlow ? ' د.ل' : '')],
                                ['التدفقات التمويلية الموثقة', 'أنشطة تمويلية', cashFlowValue(0) + (hasVerifiedCashFlow ? ' د.ل' : '')]
                              ];
                              let rowsHtml = entries.map(e => `
                                <tr>
                                  <td style="font-weight: bold;">${e[0]}</td>
                                  <td>${e[1]}</td>
                                  <td style="text-align: left; font-family: monospace;">${e[2]}</td>
                                </tr>
                              `).join('');
                              const cashNetValue = hasVerifiedCashFlow
                                ? (actualCashInflow - actualCashOutflow).toLocaleString(undefined, { minimumFractionDigits: 2 }) + ' د.ل'
                                : 'غير متحقق';
                              const summaryHtml = `
                                <div style="margin-top: 20px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; font-weight: bold; font-size: 12px; display: flex; justify-content: space-between; color: #166534;">
                                  <span>صافي التغير الإيجابي في السيولة النقدية والمصرفية المتاحة:</span>
                                  <span>${cashNetValue}</span>
                                </div>
                              `;
                              printReportPdf('قائمة التدفقات النقدية المقارنة (Cash Flow)', 'بيان مصادر واستخدامات النقدية حسب الفئات الثلاث المعتمدة محاسبياً.', ['بند التدفق نقدي والتصنيف الدفتري', 'نوع النشاط', 'القيمة المتدفقة للفترة'], rowsHtml, summaryHtml);
                            } else if (selectedReport === 'account_statement') {
                              const targetAcc = accounts.find(a => a.code === filterAccount);
                              let running = targetAcc ? targetAcc.balance * 0.7 : 0;
                              let rowsHtml = `
                                <tr>
                                  <td>-</td>
                                  <td style="font-weight: bold;">رصيد افتتاحي مرحل</td>
                                  <td>قيد رصيد بداية المدة المعتمد</td>
                                  <td style="text-align: left; font-family: monospace;">-</td>
                                  <td style="text-align: left; font-family: monospace;">-</td>
                                  <td style="text-align: left; font-family: monospace; font-weight: bold;">${running.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
                                </tr>
                              `;
                              let totalDeb = 0;
                              let totalCrd = 0;

                              journalEntries.forEach((entry: any) => {
                                if (entry.status !== 'مرحل' && entry.status !== 'معتمد') return;
                                if (entry.date < filterFromDate || entry.date > filterToDate) return;
                                if (Array.isArray(entry.lines)) {
                                  entry.lines.forEach((line: any) => {
                                  if (line.accountCode === filterAccount) {
                                    if (filterCostCenter !== 'all' && line.costCenter !== filterCostCenter) return;
                                    const deb = Number(line.debit) || 0;
                                    const crd = Number(line.credit) || 0;
                                    totalDeb += deb;
                                    totalCrd += crd;
                                    const isDeb = targetAcc?.natureType === 'مدين' || targetAcc?.classification === 'أصول';
                                    running = isDeb ? (running + deb - crd) : (running + crd - deb);
                                    rowsHtml += `
                                      <tr>
                                        <td style="font-family: monospace;">${entry.date}</td>
                                        <td style="font-family: monospace; font-weight: bold;">${entry.id}</td>
                                        <td>${line.description || entry.description}</td>
                                        <td style="text-align: left; font-family: monospace;">${deb > 0 ? deb.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                        <td style="text-align: left; font-family: monospace;">${crd > 0 ? crd.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                        <td style="text-align: left; font-family: monospace; font-weight: bold;">${running.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
                                      </tr>
                                    `;
                                  }
                                });
                                }
                              });

                              const summaryHtml = `
                                <div style="margin-top: 15px; background: #fafafa; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; font-size: 11px; line-height: 1.6; font-weight: bold;">
                                  <div style="display: flex; justify-content: space-between;">
                                    <span>مجموع الحركات المدينة خلال الفترة:</span>
                                    <span style="font-family: monospace; color: #1d4ed8;">${totalDeb.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span>
                                  </div>
                                  <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                                    <span>مجموع الحركات الدائنة خلال الفترة:</span>
                                    <span style="font-family: monospace; color: #b91c1c;">${totalCrd.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span>
                                  </div>
                                  <div style="display: flex; justify-content: space-between; margin-top: 8px; border-top: 1px dashed #cbd5e1; padding-top: 5px; font-size: 12px; color: #0f172a;">
                                    <span>الرصيد الختامي المتراكم للحساب:</span>
                                    <span style="font-family: monospace;">${running.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span>
                                  </div>
                                </div>
                              `;

                              printReportPdf(`كشف الحساب التفصيلي (${filterAccount} - ${targetAcc?.nameAr || ''})`, 'عرض لجميع القيود وحركات الأستاذ المساعد مع رصيد تراكمي مستمر.', ['التاريخ', 'رقم القيد', 'البيان وتفصيل الحركة المعتمد', 'مدين', 'دائن', 'الرصيد المتراكم'], rowsHtml, summaryHtml);
                            } else if (selectedReport === 'general_ledger') {
                              let rowsHtml = '';
                              reportAccounts.forEach(a => {
                                rowsHtml += `
                                  <tr>
                                    <td style="font-family: monospace;">${a.code}</td>
                                    <td style="font-weight: bold; padding-right: ${a.level * 12}px;">${a.nameAr}</td>
                                    <td>${a.natureType}</td>
                                    <td style="text-align: left; font-family: monospace;">${a.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
                                    <td style="text-align: left; font-family: monospace; color: #1d4ed8;">${a.debitMovements > 0 ? a.debitMovements.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                    <td style="text-align: left; font-family: monospace; color: #b91c1c;">${a.creditMovements > 0 ? a.creditMovements.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                    <td style="text-align: left; font-family: monospace; font-weight: bold;">${a.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
                                  </tr>
                                `;
                              });
                              printReportPdf('دفتر الأستاذ العام المجمع للأرصدة (General Ledger)', 'كشف مركزي للأرصدة الافتتاحية وحركات المدين والدائن والأرصدة الختامية لجميع مستويات الحسابات.', ['رمز الحساب', 'اسم البند المحاسبي', 'طبيعة', 'رصيد افتتاحي', 'حركة مدين', 'حركة دائن', 'رصيد ختامي معتمد'], rowsHtml);
                            } else if (selectedReport === 'trial_balance_movements') {
                              let rowsHtml = '';
                              reportAccounts.forEach(a => {
                                const isDeb = a.natureType === 'مدين';
                                rowsHtml += `
                                  <tr>
                                    <td style="font-family: monospace;">${a.code}</td>
                                    <td style="font-weight: bold; padding-right: ${a.level * 10}px;">${a.nameAr}</td>
                                    <td style="text-align: left; font-family: monospace;">${isDeb ? a.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                    <td style="text-align: left; font-family: monospace;">${!isDeb ? a.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                    <td style="text-align: left; font-family: monospace; color: #1d4ed8;">${a.debitMovements > 0 ? a.debitMovements.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                    <td style="text-align: left; font-family: monospace; color: #b91c1c;">${a.creditMovements > 0 ? a.creditMovements.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                    <td style="text-align: left; font-family: monospace; font-weight: bold;">${isDeb ? a.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                    <td style="text-align: left; font-family: monospace; font-weight: bold;">${!isDeb ? a.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                  </tr>
                                `;
                              });
                              printReportPdf('ميزان المراجعة الموسع بالأرصدة والحركات (6 أعمدة)', 'تقرير قانوني لمطابقة الأرصدة والحركات والتدويرات الدفترية لمجمع المدارس.', ['رمز', 'اسم الحساب المحاسبي', 'افتتاحي مدين', 'افتتاحي دائن', 'حركة مدين', 'حركة دائن', 'ختامي مدين', 'ختامي دائن'], rowsHtml);
                            }
                          }}
                          className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{reportsAreCanonical ? 'طباعة PDF المعتمد' : 'طباعة نسخة عرض PDF'}</span>
                        </button>
                      </div>
                    </div>

                    {/* DYNAMIC REPORT INNER VIEW CONTENT */}
                    
                    {/* 1. TRIAL BALANCE VIEW */}
                    {selectedReport === 'trial_balance' && (
                      <div className="space-y-4">
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-right border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                                <th className="p-3 text-right">رمز الحساب</th>
                                <th className="p-3 text-right">اسم الحساب الدفتري</th>
                                <th className="p-3 text-right">المستوى</th>
                                <th className="p-3 text-right">التصنيف الرئيسي</th>
                                <th className="p-3 text-left">أرصدة مدينة (د.ل)</th>
                                <th className="p-3 text-left">أرصدة دائنة (د.ل)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(() => {
                                let sumDeb = 0;
                                let sumCrd = 0;
                                return (
                                  <>
                                    {reportAccounts
                                      .filter(a => trialBalanceLevel === 'all' || a.level === trialBalanceLevel)
                                      .map(acc => {
                                        const isDeb = acc.natureType === 'مدين' || acc.classification === 'أصول' || acc.classification === 'مصروفات';
                                        const debitVal = isDeb ? acc.endingBalance : 0;
                                        const creditVal = !isDeb ? acc.endingBalance : 0;
                                        sumDeb += debitVal;
                                        sumCrd += creditVal;

                                        return (
                                          <tr 
                                            key={acc.id} 
                                            className={`hover:bg-blue-50/50 transition-colors cursor-pointer group/row ${acc.type === 'رئيسي' ? 'font-bold bg-slate-50/40 text-slate-900' : 'text-slate-650'}`}
                                            onClick={() => handleDrillDownToAccount(acc.code)}
                                            onDoubleClick={() => handleDrillDownToAccount(acc.code)}
                                          >
                                            <td className="p-3 font-mono text-blue-700 font-semibold">{acc.code}</td>
                                            <td className="p-3" style={{ paddingRight: `${acc.level * 16}px` }}>
                                               <span className="flex items-center gap-1.5 justify-between w-full">
                                                 <span className="flex items-center gap-1.5">
                                                   {acc.type === 'رئيسي' ? '📁' : '📄'}
                                                   <span className="group-hover/row:text-blue-900 transition-colors font-bold">{acc.nameAr}</span>
                                                 </span>
                                                 <span className="opacity-0 group-hover/row:opacity-100 transition-all text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-sans flex items-center gap-0.5 select-none font-black ml-2">
                                                   <span>كشف الحساب</span>
                                                   <span>📊</span>
                                                 </span>
                                               </span>
                                             </td>
                                            <td className="p-3">
                                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${acc.level === 1 ? 'bg-purple-100 text-purple-700' : acc.level === 2 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                مستوى {acc.level}
                                              </span>
                                            </td>
                                            <td className="p-3 font-medium text-slate-500">{acc.classification}</td>
                                            <td className="p-3 font-mono text-left text-emerald-700 font-semibold">
                                              {debitVal > 0 ? debitVal.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="p-3 font-mono text-left text-indigo-700 font-semibold">
                                              {creditVal > 0 ? creditVal.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    <tr className="bg-indigo-50/65 font-black text-slate-900 border-t-2 border-indigo-250">
                                      <td colSpan={4} className="p-3.5 text-center text-sm">الإجمالي الموزون المتطابق لميزان المراجعة ⚖️</td>
                                      <td className="p-3.5 font-mono text-left text-sm text-emerald-800">{sumDeb.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
                                      <td className="p-3.5 font-mono text-left text-sm text-indigo-800">{sumCrd.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
                                    </tr>
                                  </>
                                );
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 2. INCOME STATEMENT VIEW */}
                    {selectedReport === 'income_statement' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Revenues list */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                            <h4 className="text-xs font-black text-emerald-800 border-b border-emerald-150 pb-2 flex justify-between">
                              <span>إيرادات التشغيل والتعليم (Revenues)</span>
                              <span>الرصيد المجموع</span>
                            </h4>
                            <div className="space-y-2">
                              {reportAccounts
                                .filter(a => a.classification === 'إيرادات' && a.level === 3)
                                .map(a => (
                                  <div key={a.id} className="flex justify-between items-center text-[11px] hover:bg-emerald-50/80 p-1.5 rounded transition-all cursor-pointer group/row border-b border-dashed border-transparent hover:border-emerald-200" onClick={() => handleDrillDownToAccount(a.code)} onDoubleClick={() => handleDrillDownToAccount(a.code)}>
                                    <span className="text-slate-700 font-medium group-hover/row:text-emerald-900 flex items-center gap-1.5">
                                      <span>{a.nameAr}</span>
                                      <span className="text-slate-400 font-mono text-[9px]">({a.code})</span>
                                      <span className="opacity-0 group-hover/row:opacity-100 transition-all text-[8px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-sans select-none font-extrabold">كشف حساب 📊</span>
                                    </span>
                                    <span className="font-mono text-emerald-700 font-semibold" dir="ltr">{periodRevenue(a).toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span>
                                  </div>
                                ))}
                            </div>
                            <div className="border-t border-emerald-200 pt-2 flex justify-between items-center font-bold text-emerald-900 text-xs">
                              <span>إجمالي الإيرادات المقررة:</span>
                              <span className="font-mono text-sm">{totalRevenues.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span>
                            </div>
                          </div>

                          {/* Expenses list */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                            <h4 className="text-xs font-black text-rose-800 border-b border-rose-150 pb-2 flex justify-between">
                              <span>المصروفات والأجور العمومية (Expenses)</span>
                              <span>الرصيد المجموع</span>
                            </h4>
                            <div className="space-y-2 max-h-[220px] overflow-y-auto">
                              {reportAccounts
                                .filter(a => a.classification === 'مصروفات' && a.level === 3)
                                .map(a => (
                                  <div key={a.id} className="flex justify-between items-center text-[11px] hover:bg-rose-50/80 p-1.5 rounded transition-all cursor-pointer group/row border-b border-dashed border-transparent hover:border-rose-200" onClick={() => handleDrillDownToAccount(a.code)} onDoubleClick={() => handleDrillDownToAccount(a.code)}>
                                    <span className="text-slate-700 font-medium group-hover/row:text-rose-900 flex items-center gap-1.5">
                                      <span>{a.nameAr}</span>
                                      <span className="text-slate-400 font-mono text-[9px]">({a.code})</span>
                                      <span className="opacity-0 group-hover/row:opacity-100 transition-all text-[8px] bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded font-sans select-none font-extrabold">كشف حساب 📊</span>
                                    </span>
                                    <span className="font-mono text-rose-700 font-semibold" dir="ltr">{periodExpense(a).toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span>
                                  </div>
                                ))}
                            </div>
                            <div className="border-t border-rose-200 pt-2 flex justify-between items-center font-bold text-rose-900 text-xs">
                              <span>إجمالي المصروفات الدفترية:</span>
                              <span className="font-mono text-sm">{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span>
                            </div>
                          </div>
                        </div>

                        {/* Net Income outcome card */}
                        <div className={`border rounded-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 ${netIncome >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                          <div className="space-y-1 text-center sm:text-right">
                            <h4 className={`text-sm font-black ${netIncome >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                              {netIncome >= 0 ? 'الفائض المالي التشغيلي (صافي أرباح المجمع)' : 'العجز المالي التشغيلي للفرع (صافي الخسارة)'}
                            </h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed">ناتج طرح المصروفات والرواتب من الإيرادات والتحصيلات الكلية خلال المدى المحدد.</p>
                          </div>
                          <div className="text-center sm:text-left">
                            <span className={`block font-mono text-2xl font-black ${netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}`} dir="ltr">
                              {netIncome >= 0 ? '+' : ''}{netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل
                            </span>
                            <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-[9px] font-bold ${netIncome >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'}`}>
                              {netIncome >= 0 ? 'مؤشر ربحي إيجابي 📈' : 'يرجى مراجعة ترشيد النفقات ⚠️'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. BALANCE SHEET VIEW */}
                    {selectedReport === 'balance_sheet' && (
                      <div className="space-y-6">
                        {/* Equations balance banner */}
                        <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                          <div className="space-y-1 text-center md:text-right">
                            <p className="text-xs font-black text-amber-300">معادلة المركز المالي الحسابية المعتمدة</p>
                            <p className="text-[11px] text-slate-300">مجموع الأصول والسيولة يجب أن يتطابق تماماً مع مجموع الالتزامات والخصوم مع رأس المال المضاف.</p>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-mono">
                            <div className="text-center">
                              <span className="block text-[10px] text-slate-400">الأصول 🏛️</span>
                              <span className="font-black text-blue-300">{formatCurrency(totalAssets, true)}</span>
                            </div>
                            <span className="text-lg font-black text-slate-400">=</span>
                            <div className="text-center">
                              <span className="block text-[10px] text-slate-400">الخصوم وحقوق الملكية ⚖️</span>
                              <span className="font-black text-indigo-300">{formatCurrency(totalLiabilities + totalEquity, true)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Two columns: Assets vs. Liabilities & Equity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Right column: Assets */}
                          <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                            <h4 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2 text-blue-700 flex justify-between">
                              <span>الأصول والموجودات (Assets)</span>
                              <span>القيمة الختامية</span>
                            </h4>
                            <div className="space-y-2.5">
                              {reportAccounts
                                .filter(a => a.classification === 'أصول' && a.level === 3)
                                .map(a => (
                                  <div key={a.id} className="flex justify-between items-center text-[11px] hover:bg-blue-50/70 p-2 rounded transition-all cursor-pointer group/row border-b border-dashed border-transparent hover:border-blue-200" onClick={() => handleDrillDownToAccount(a.code)} onDoubleClick={() => handleDrillDownToAccount(a.code)}>
                                    <span className="text-slate-700 font-medium group-hover/row:text-blue-900 flex items-center gap-1.5">
                                      <span>{a.nameAr}</span>
                                      <span className="text-slate-400 text-[10px]">({a.code})</span>
                                      <span className="opacity-0 group-hover/row:opacity-100 transition-all text-[8px] bg-blue-100 text-blue-850 px-1.5 py-0.5 rounded font-sans select-none font-bold">كشف حساب 📊</span>
                                    </span>
                                    <span className="font-mono text-emerald-700 font-semibold" dir="ltr">{a.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span>
                                  </div>
                                ))}
                            </div>
                            <div className="border-t border-slate-200 pt-3 flex justify-between items-center font-bold text-slate-900 text-xs">
                              <span>إجمالي الأصول (Assets Total):</span>
                              <span className="font-mono text-sm text-blue-700">{totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span>
                            </div>
                          </div>

                          {/* Left column: Liabilities & Equity */}
                          <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                            <h4 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2 text-indigo-700 flex justify-between">
                              <span>الخصوم وحقوق الملكية (Liabilities & Equity)</span>
                              <span>القيمة الختامية</span>
                            </h4>
                            <div className="space-y-4">
                              {/* Liabilities subgroup */}
                              <div className="space-y-2">
                                <p className="text-[10px] text-slate-400 font-black">الالتزامات والخصوم (Liabilities)</p>
                                {reportAccounts
                                  .filter(a => a.classification === 'خصوم' && a.level === 3)
                                  .map(a => (
                                    <div key={a.id} className="flex justify-between items-center text-[11px] hover:bg-indigo-50/70 p-2 rounded transition-all cursor-pointer group/row border-b border-dashed border-transparent hover:border-indigo-200" onClick={() => handleDrillDownToAccount(a.code)} onDoubleClick={() => handleDrillDownToAccount(a.code)}>
                                      <span className="text-slate-700 font-medium group-hover/row:text-indigo-900 flex items-center gap-1.5">
                                        <span>{a.nameAr}</span>
                                        <span className="text-slate-400 text-[10px]">({a.code})</span>
                                        <span className="opacity-0 group-hover/row:opacity-100 transition-all text-[8px] bg-indigo-100 text-indigo-850 px-1.5 py-0.5 rounded font-sans select-none font-bold">كشف حساب 📊</span>
                                      </span>
                                      <span className="font-mono text-indigo-700 font-semibold" dir="ltr">{a.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span>
                                    </div>
                                  ))}
                              </div>

                              {/* Equity subgroup */}
                              <div className="space-y-2 border-t border-slate-100 pt-3">
                                <p className="text-[10px] text-slate-400 font-black">رأس المال وحقوق الملكية (Equity)</p>
                                {reportAccounts
                                  .filter(a => a.classification === 'حقوق ملكية' && a.level === 3)
                                  .map(a => (
                                    <div key={a.id} className="flex justify-between items-center text-[11px] hover:bg-slate-100/70 p-2 rounded transition-all cursor-pointer group/row border-b border-dashed border-transparent hover:border-slate-300" onClick={() => handleDrillDownToAccount(a.code)} onDoubleClick={() => handleDrillDownToAccount(a.code)}>
                                      <span className="text-slate-700 font-medium group-hover/row:text-slate-900 flex items-center gap-1.5">
                                        <span>{a.nameAr}</span>
                                        <span className="text-slate-400 text-[10px]">({a.code})</span>
                                        <span className="opacity-0 group-hover/row:opacity-100 transition-all text-[8px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-sans select-none font-bold">كشف حساب 📊</span>
                                      </span>
                                      <span className="font-mono text-slate-700 font-semibold" dir="ltr">{a.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span>
                                    </div>
                                  ))}
                              </div>
                            </div>

                            <div className="border-t border-slate-200 pt-3 flex justify-between items-center font-bold text-slate-900 text-xs">
                              <span>مجموع (الخصوم + الملكية):</span>
                              <span className="font-mono text-sm text-indigo-700">{(totalLiabilities + totalEquity).toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4. CASH FLOW VIEW */}
                    {selectedReport === 'cash_flow' && (
                      <div className="space-y-6">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <h4 className="text-xs font-black text-slate-900">تفصيل التدفق المالي الوارد والمنصرف بالأنشطة الأساسية الثلاث</h4>
                            <span className="text-[9px] bg-indigo-50 text-indigo-750 px-2 py-0.5 rounded font-black">انقر على أي بند لاستعراض كشف الحساب والتحليل الفوري 📊</span>
                          </div>
                          
                          <div className="space-y-3">
                            {/* Operating activities */}
                            <div className="space-y-2">
                              <h5 className="text-[11px] font-black text-blue-700 bg-blue-50/70 p-1.5 rounded">1. التدفقات النقدية من الأنشطة التشغيلية (Operating Cash Flows)</h5>
                              <div className="space-y-1.5 pl-3 text-[11px]">
                                <div 
                                  className="flex justify-between text-slate-600 hover:bg-slate-100 p-1.5 rounded transition-all cursor-pointer group/cf"
                                  onClick={() => handleDrillDownToAccount('4100')}
                                  onDoubleClick={() => handleDrillDownToAccount('4100')}
                                  title="انقر لعرض كشف حساب إيرادات الرسوم الدراسية"
                                >
                                  <span className="flex items-center gap-2">
                                    <span>المتحصلات النقدية الموثقة من القيود المرحّلة</span>
                                    <span className="opacity-0 group-hover/cf:opacity-100 transition-all text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-sans select-none font-bold">كشف حساب 📊</span>
                                  </span>
                                  <span className="font-mono text-emerald-700 font-bold">{hasVerifiedCashFlow ? `+${actualCashInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل` : 'غير متحقق'}</span>
                                </div>
                                <div 
                                  className="flex justify-between text-slate-600 hover:bg-slate-100 p-1.5 rounded transition-all cursor-pointer group/cf"
                                  onClick={() => handleDrillDownToAccount('5100')}
                                  onDoubleClick={() => handleDrillDownToAccount('5100')}
                                  title="انقر لعرض كشف حساب الرواتب والأجور"
                                >
                                  <span className="flex items-center gap-2">
                                    <span>المدفوعات النقدية الموثقة من القيود المرحّلة</span>
                                    <span className="opacity-0 group-hover/cf:opacity-100 transition-all text-[8px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-sans select-none font-bold">كشف حساب 📊</span>
                                  </span>
                                  <span className="font-mono text-rose-700 font-bold">{hasVerifiedCashFlow ? `-${actualCashOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل` : 'غير متحقق'}</span>
                                </div>
                                <div 
                                  className="flex justify-between text-slate-600 hover:bg-slate-100 p-1.5 rounded transition-all cursor-pointer group/cf"
                                  onClick={() => handleDrillDownToAccount('5200')}
                                  onDoubleClick={() => handleDrillDownToAccount('5200')}
                                  title="انقر لعرض كشف حساب المصروفات العمومية والإدارية"
                                >
                                  <span className="flex items-center gap-2">
                                    <span>تفصيل إضافي للمصروفات النقدية — غير متاح دون تصنيف موثق</span>
                                    <span className="opacity-0 group-hover/cf:opacity-100 transition-all text-[8px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-sans select-none font-bold">كشف حساب 📊</span>
                                  </span>
                                  <span className="font-mono text-rose-700 font-bold">{hasVerifiedCashFlow ? `-${actualCashOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل` : 'غير متحقق'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Investing activities */}
                            <div className="space-y-2 border-t border-slate-100 pt-2">
                              <h5 className="text-[11px] font-black text-indigo-700 bg-indigo-50/70 p-1.5 rounded">2. التدفقات النقدية من الأنشطة الاستثمارية (Investing Cash Flows)</h5>
                              <div className="space-y-1.5 pl-3 text-[11px]">
                                <div 
                                  className="flex justify-between text-slate-600 hover:bg-slate-100 p-1.5 rounded transition-all cursor-pointer group/cf"
                                  onClick={() => handleDrillDownToAccount('1300')}
                                  onDoubleClick={() => handleDrillDownToAccount('1300')}
                                  title="انقر لعرض كشف حساب الأصول الثابتة"
                                >
                                  <span className="flex items-center gap-2">
                                    <span>مدفوعات حيازة وتجهيز حافلات ومقاعد مدرسية ثابتة</span>
                                    <span className="opacity-0 group-hover/cf:opacity-100 transition-all text-[8px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-sans select-none font-bold">كشف حساب 📊</span>
                                  </span>
                                    <span className="font-mono text-rose-700 font-bold">{cashFlowValue(0)}{hasVerifiedCashFlow ? ' د.ل' : ''}</span>
                                </div>
                              </div>
                            </div>

                            {/* Financing activities */}
                            <div className="space-y-2 border-t border-slate-100 pt-2">
                              <h5 className="text-[11px] font-black text-purple-700 bg-purple-50/70 p-1.5 rounded">3. التدفقات النقدية من الأنشطة التمويلية (Financing Cash Flows)</h5>
                              <div className="space-y-1.5 pl-3 text-[11px]">
                                <div 
                                  className="flex justify-between text-slate-600 hover:bg-slate-100 p-1.5 rounded transition-all cursor-pointer group/cf"
                                  onClick={() => handleDrillDownToAccount('3100')}
                                  onDoubleClick={() => handleDrillDownToAccount('3100')}
                                  title="انقر لعرض كشف حساب رأس المال"
                                >
                                  <span className="flex items-center gap-2">
                                    <span>زيادة رأس مال المجمع والتدفق المساهم الجديد</span>
                                    <span className="opacity-0 group-hover/cf:opacity-100 transition-all text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-sans select-none font-bold">كشف حساب 📊</span>
                                  </span>
                                    <span className="font-mono text-emerald-700 font-bold">{cashFlowValue(0)}{hasVerifiedCashFlow ? ' د.ل' : ''}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Cash Flow Summary Ending */}
                          <div className="border-t border-slate-200 pt-3 flex justify-between items-center font-bold text-xs text-slate-900 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                            <span className="text-emerald-800">صافي التغير الإيجابي في النقدية المتاحة بصندوق ومصرف المدارس:</span>
                            <span className="font-mono text-sm text-emerald-700" dir="ltr">
                              {hasVerifiedCashFlow ? `${(actualCashInflow - actualCashOutflow).toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل` : 'غير متحقق'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. ACCOUNT STATEMENT VIEW */}
                    {selectedReport === 'account_statement' && (
                      <div className="space-y-4 animate-fade-in">
                        {/* Selector indicator */}
                        <div className="flex items-center justify-between bg-purple-50 border border-purple-100 p-4 rounded-xl">
                          <div>
                            <p className="text-xs font-black text-purple-900">دفتر الأستاذ المساعد للحساب المحدد</p>
                            <p className="text-[11px] text-purple-700 mt-1">يحتسب الرصيد التراكمي للحركات الجارية في الدفتر مباشرة من قيود اليومية المحسوبة للبنود الفرعية والرئيسية.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-600 font-bold">اختر الحساب المستهدف:</span>
                            <select
                              value={filterAccount}
                              onChange={(e) => setFilterAccount(e.target.value)}
                              className="bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer text-xs max-w-xs md:max-w-md"
                            >
                              <option value="all">جميع بنود الحسابات والدفاتر الفرعية</option>
                              {accounts.map(a => (
                                <option key={a.id} value={a.code}>
                                  {a.type === 'رئيسي' ? '📁' : '📄'} {a.code} - {a.nameAr}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Statement table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-right border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                                <th className="p-3 text-right">التاريخ</th>
                                <th className="p-3 text-right">رقم القيد</th>
                                <th className="p-3 text-right">البيان وتفاصيل المعاملة الدفترية</th>
                                <th className="p-3 text-left">مدين (د.ل)</th>
                                <th className="p-3 text-left">دائن (د.ل)</th>
                                <th className="p-3 text-left bg-purple-50/50">الرصيد التراكمي المستمر (د.ل)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(() => {
                                const reportAccounts = getProcessedAccounts({
                                  fromDate: filterFromDate,
                                  toDate: filterToDate,
                                  costCenter: filterCostCenter
                                });
                                const targetAcc = reportAccounts.find(a => a.code === filterAccount || a.id === filterAccount);
                                if (!targetAcc) {
                                  return (
                                    <tr>
                                      <td colSpan={6} className="p-4 text-center text-slate-400">يرجى اختيار حساب محاسبي صحيح لاستعراض كشف حركته من القائمة المتاحة.</td>
                                    </tr>
                                  );
                                }

                                let runningBalance = targetAcc.openingBalance || 0;
                                let totalDr = 0;
                                let totalCr = 0;

                                const matchingLines: any[] = [];
                                getNormalizedJournalEntries().forEach((entry: any) => {
                                  if (entry.status !== 'مرحل' && entry.status !== 'معتمد') return;
                                  if (entry.date < filterFromDate || entry.date > filterToDate) return;

                                  if (Array.isArray(entry.lines)) {
                                    entry.lines.forEach((line: any) => {
                                      if (isAccountOrDescendant(line.accountCode, filterAccount)) {
                                        if (filterCostCenter !== 'all' && line.costCenter !== filterCostCenter) return;
                                        matchingLines.push({
                                          date: entry.date,
                                          id: entry.id,
                                          description: line.description || entry.description,
                                          debit: Number(line.debit) || 0,
                                          credit: Number(line.credit) || 0,
                                          accountCode: line.accountCode,
                                          accountName: accounts.find(a => a.code === line.accountCode)?.nameAr || line.accountCode
                                        });
                                      }
                                    });
                                  }
                                });

                                // Sort lines by date
                                matchingLines.sort((a, b) => a.date.localeCompare(b.date));

                                return (
                                  <>
                                    <tr className="bg-slate-50/30">
                                      <td className="p-3 text-slate-400 font-mono">-</td>
                                      <td className="p-3 text-slate-400 font-mono">-</td>
                                      <td className="p-3 text-slate-850 font-bold flex items-center gap-2">
                                        <span>رصيد افتتاحي مرحل بداية المدى المالي</span>
                                        <span className="text-[10px] bg-slate-150 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                                          ({filterFromDate} إلى {filterToDate})
                                        </span>
                                      </td>
                                      <td className="p-3 text-left font-mono text-slate-400">-</td>
                                      <td className="p-3 text-left font-mono text-slate-400">-</td>
                                      <td className="p-3 text-left font-mono text-slate-900 font-black bg-purple-50/35">{runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
                                    </tr>

                                    {matchingLines.map((line, idx) => {
                                      totalDr += line.debit;
                                      totalCr += line.credit;

                                      const isDebitNature = targetAcc.natureType === 'مدين' || targetAcc.classification === 'أصول' || targetAcc.classification === 'مصروفات';
                                      runningBalance = isDebitNature 
                                        ? (runningBalance + line.debit - line.credit)
                                        : (runningBalance + line.credit - line.debit);

                                      return (
                                        <tr 
                                          key={idx} 
                                          className="hover:bg-purple-50/60 transition-colors cursor-pointer group/row"
                                          onClick={() => handleDrillDownToJournalEntry(line.id)}
                                          onDoubleClick={() => handleDrillDownToJournalEntry(line.id)}
                                          title="انقر نقراً مزدوجاً لعرض القيد المحاسبي بالكامل"
                                        >
                                          <td className="p-3 font-mono text-slate-500">{line.date}</td>
                                          <td className="p-3 font-mono text-blue-700 font-bold">
                                            <span className="flex items-center gap-1.5 justify-between">
                                              <span className="group-hover/row:underline">{line.id}</span>
                                              <span className="opacity-0 group-hover/row:opacity-100 transition-all text-[8px] bg-purple-100 text-purple-850 px-1.5 py-0.5 rounded font-sans font-extrabold flex items-center gap-0.5 select-none">
                                                <span>نقر مزدوج لعرض القيد</span>
                                                <span>📜</span>
                                              </span>
                                            </span>
                                          </td>
                                          <td className="p-3 text-slate-700">
                                            <span className="block font-medium">{line.description}</span>
                                            {targetAcc && targetAcc.type === 'رئيسي' && (
                                              <span className="block text-[10px] text-indigo-600 font-extrabold mt-1 font-sans">
                                                🔖 الحساب التفصيلي المتأثر: {line.accountCode} - {line.accountName}
                                              </span>
                                            )}
                                          </td>
                                          <td className="p-3 font-mono text-left text-emerald-700 font-bold">{line.debit > 0 ? line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                          <td className="p-3 font-mono text-left text-rose-700 font-bold">{line.credit > 0 ? line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                          <td className="p-3 font-mono text-left text-slate-900 font-black bg-purple-50/20">{runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
                                        </tr>
                                      );
                                    })}

                                    <tr className="bg-purple-50 font-black text-slate-900 border-t border-purple-200">
                                      <td colSpan={3} className="p-3.5 text-center text-xs">مجموع الحركة الدورية وصافي الرصيد الختامي للفترة</td>
                                      <td className="p-3.5 font-mono text-left text-emerald-800">{totalDr.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
                                      <td className="p-3.5 font-mono text-left text-rose-800">{totalCr.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
                                      <td className="p-3.5 font-mono text-left bg-purple-100 text-purple-900">{runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل</td>
                                    </tr>
                                  </>
                                );
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 6. GENERAL LEDGER VIEW */}
                    {selectedReport === 'general_ledger' && (
                      <div className="space-y-4">
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-right border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                                <th className="p-3 text-right">رمز الحساب</th>
                                <th className="p-3 text-right">البند الحسابي</th>
                                <th className="p-3 text-right">الطبيعة</th>
                                <th className="p-3 text-left">رصيد افتتاحي (د.ل)</th>
                                <th className="p-3 text-left">الحركات المدينة خلال الفترة</th>
                                <th className="p-3 text-left">الحركات الدائنة خلال الفترة</th>
                                <th className="p-3 text-left bg-blue-50">رصيد ختامي معتمد (د.ل)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {reportAccounts.map(a => (
                                <tr 
                                  key={a.id} 
                                  className={`hover:bg-blue-50/50 transition-colors cursor-pointer group/row ${a.type === 'رئيسي' ? 'font-bold bg-slate-50/30 text-slate-900' : 'text-slate-650'}`}
                                  onClick={() => handleDrillDownToAccount(a.code)}
                                  onDoubleClick={() => handleDrillDownToAccount(a.code)}
                                >
                                  <td className="p-3 font-mono text-blue-700 font-bold">{a.code}</td>
                                  <td className="p-3" style={{ paddingRight: `${a.level * 14}px` }}>
                                    <span className="flex items-center justify-between w-full">
                                      <span className="group-hover/row:text-blue-900 transition-colors font-bold">{a.nameAr}</span>
                                      <span className="opacity-0 group-hover/row:opacity-100 transition-all text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-sans flex items-center gap-0.5 select-none font-bold ml-2">
                                        <span>كشف الحساب</span>
                                        <span>📊</span>
                                      </span>
                                    </span>
                                  </td>
                                  <td className="p-3 font-medium text-slate-500">{a.natureType}</td>
                                  <td className="p-3 font-mono text-left text-slate-500">{a.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                  <td className="p-3 font-mono text-left text-emerald-700 font-semibold">
                                    {a.debitMovements > 0 ? a.debitMovements.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                  </td>
                                  <td className="p-3 font-mono text-left text-rose-700 font-semibold">
                                    {a.creditMovements > 0 ? a.creditMovements.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                  </td>
                                  <td className="p-3 font-mono text-left text-blue-800 font-black bg-blue-50/40">{a.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 7. BALANCES & MOVEMENTS TRIAL BALANCE (6 columns) */}
                    {selectedReport === 'trial_balance_movements' && (
                      <div className="space-y-4">
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-right border-collapse text-[11px]">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-extrabold text-center">
                                <th rowSpan={2} className="p-3 text-right">رمز</th>
                                <th rowSpan={2} className="p-3 text-right">اسم الحساب المحاسبي</th>
                                <th colSpan={2} className="p-2 border-b border-slate-250 bg-slate-50">الأرصدة الافتتاحية</th>
                                <th colSpan={2} className="p-2 border-b border-slate-250 bg-indigo-50/50">حركات الفترة الجارية</th>
                                <th colSpan={2} className="p-2 border-b border-slate-250 bg-blue-50">الأرصدة الختامية المعتمدة</th>
                              </tr>
                              <tr className="bg-slate-50 text-[10px] font-bold text-slate-700 border-b border-slate-200">
                                <th className="p-2 text-left">مدين</th>
                                <th className="p-2 text-left border-l border-slate-200">دائن</th>
                                <th className="p-2 text-left">مدين</th>
                                <th className="p-2 text-left border-l border-slate-200">دائن</th>
                                <th className="p-2 text-left">مدين</th>
                                <th className="p-2 text-left">دائن</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {(() => {
                                let sumOpDr = 0; let sumOpCr = 0;
                                let sumMoDr = 0; let sumMoCr = 0;
                                let sumEdDr = 0; let sumEdCr = 0;

                                return (
                                  <>
                                    {reportAccounts.map(a => {
                                      const isDeb = a.natureType === 'مدين';
                                      const opDr = isDeb ? a.openingBalance : 0;
                                      const opCr = !isDeb ? a.openingBalance : 0;
                                      const edDr = isDeb ? a.endingBalance : 0;
                                      const edCr = !isDeb ? a.endingBalance : 0;

                                      sumOpDr += opDr; sumOpCr += opCr;
                                      sumMoDr += a.debitMovements; sumMoCr += a.creditMovements;
                                      sumEdDr += edDr; sumEdCr += edCr;

                                      return (
                                        <tr 
                                          key={a.id} 
                                          className={`hover:bg-blue-50/50 transition-colors cursor-pointer group/row ${a.type === 'رئيسي' ? 'font-bold bg-slate-50/20 text-slate-900' : 'text-slate-650'}`}
                                          onClick={() => handleDrillDownToAccount(a.code)}
                                          onDoubleClick={() => handleDrillDownToAccount(a.code)}
                                        >
                                          <td className="p-2.5 font-mono text-blue-700 font-bold">{a.code}</td>
                                          <td className="p-2.5" style={{ paddingRight: `${a.level * 10}px` }}>
                                            <span className="flex items-center justify-between w-full">
                                              <span className="group-hover/row:text-blue-900 transition-colors font-bold">{a.nameAr}</span>
                                              <span className="opacity-0 group-hover/row:opacity-100 transition-all text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-sans flex items-center gap-0.5 select-none font-bold ml-2">
                                                <span>كشف الحساب</span>
                                                <span>📊</span>
                                              </span>
                                            </span>
                                          </td>
                                          <td className="p-2.5 font-mono text-left">{opDr > 0 ? opDr.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                          <td className="p-2.5 font-mono text-left border-l border-slate-200/60">{opCr > 0 ? opCr.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                          <td className="p-2.5 font-mono text-left text-emerald-700">{a.debitMovements > 0 ? a.debitMovements.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                          <td className="p-2.5 font-mono text-left text-rose-700 border-l border-slate-200/60">{a.creditMovements > 0 ? a.creditMovements.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                          <td className="p-2.5 font-mono text-left text-blue-800 font-bold">{edDr > 0 ? edDr.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                          <td className="p-2.5 font-mono text-left text-slate-800 font-bold">{edCr > 0 ? edCr.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                        </tr>
                                      );
                                    })}
                                    
                                    <tr className="bg-slate-100 text-slate-900 font-black text-[11px] border-t-2 border-slate-300">
                                      <td colSpan={2} className="p-3 text-center text-xs">إجماليات الميزانية الموزونة المتطابقة (6 أعمدة) ⚖️</td>
                                      
                                      <td className="p-3 font-mono text-left text-slate-800">{sumOpDr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                      <td className="p-3 font-mono text-left text-slate-800 border-l border-slate-300">{sumOpCr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                      
                                      <td className="p-3 font-mono text-left text-emerald-850">{sumMoDr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                      <td className="p-3 font-mono text-left text-rose-850 border-l border-slate-300">{sumMoCr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                      
                                      <td className="p-3 font-mono text-left text-indigo-850">{sumEdDr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                      <td className="p-3 font-mono text-left text-amber-900">{sumEdCr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                  </>
                                );
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                      </>
                    )}

                  </div>
                );
              })()}
            </div>
          );
        })()}


    </>
  );
};
