import { Activity, AlertTriangle, ArrowLeft, BarChart3, Building2, ChevronLeft, FileText, Flag, Hash, Play, RefreshCw, Settings2, TrendingUp, Users } from 'lucide-react';
import React from 'react';
import { AccountingContext } from '../../../components/GeneralLedgerPortal';
import { AreaChart, Area, ComposedChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Line } from 'recharts';

export const EstimatedBudgetTab = () => {
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
  paymentVouchers, setPaymentVouchers, paymentVoucherForm, setPaymentVoucherForm, selectedPaymentVoucher, setSelectedPaymentVoucher,
  showPaymentDetailModal, setShowPaymentDetailModal, paymentSearch, setPaymentSearch,
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
  
  getNormalizedJournalEntries, handleSelectReport, handleDrillDownBreadcrumbClick,
  handleDrillDownToAccount, handleDrillDownToJournalEntry, handleDrillDownToOriginalDocument,
  hasUserPermission, exportReportExcel, handleSelectAsset, handleNewAsset, handleSaveAsset,
  handleDeleteAsset, handleRecalculateAssetDepreciation, handlePostAssetDepreciation,
  handleTransferAssetSubmit, handleSellAssetSubmit, handleDiscardAssetSubmit, handleMaintenanceSubmit,
  handleImportExcelSimulate, handleDownloadTemplate, handlePrintAssetCard, handlePrintDepreciationSchedule,
  findOriginalDocument, handleReportAccountClick, handleJournalEntryClick,
  isAccountOrDescendant, getProcessedAccounts,
  formatCurrency, triggerNotification
} = React.useContext(AccountingContext);
  const performanceData = [
    { month: 'يناير', real: 15000, estimated: 14000, cumulativeReal: 15000, cumulativeEst: 14000 },
    { month: 'فبراير', real: 28000, estimated: 29000, cumulativeReal: 43000, cumulativeEst: 43000 },
    { month: 'مارس', real: 42000, estimated: 45000, cumulativeReal: 85000, cumulativeEst: 88000 },
    { month: 'أبريل', real: 60000, estimated: 58000, cumulativeReal: 145000, cumulativeEst: 146000 },
    { month: 'مايو', real: 85000, estimated: 80000, cumulativeReal: 230000, cumulativeEst: 226000 },
    { month: 'يونيو', real: 110000, estimated: 105000, cumulativeReal: 340000, cumulativeEst: 331000 },
  ];

  return (
    <>
      {activeTab === 'estimated_budget' && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">الموازنات السنوية المعتمدة والأداء الفعلي</h2>
                <p className="text-xs text-slate-500 mt-1">مقارنة المصروفات الحاصلة بالمطابقة السنوية مع المخصص المعتمد مسبقاً من مجلس الإدارة</p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('financial_reports');
                  setActiveSidebarItem('financial_reports');
                }}
                className="px-3.5 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 transition-colors font-bold text-xs cursor-pointer bg-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>الرجوع للتقارير المالية</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {budgets.map(b => (
                <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-slate-900 mt-1">{b.category}</span>
                    <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{b.id}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block mb-0.5">المخطط (الموازنة):</span>
                      <span className="font-mono font-bold text-slate-800" dir="ltr">{b.planned.toLocaleString()} {currency}</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block mb-0.5">المنصرف الفعلي:</span>
                      <span className="font-mono font-black text-sky-600" dir="ltr">{b.actual.toLocaleString()} {currency}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-500">معدل استهلاك الموازنة :</span>
                      <span className={b.percentage > 95 ? 'text-red-600 font-extrabold' : 'text-emerald-700'}>{b.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          b.percentage > 95 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`} 
                        style={{ width: `${Math.min(100, b.percentage)}%` }} 
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      let accountCode = '5000';
                      if (b.id === 'B-01') accountCode = '5100';
                      if (b.id === 'B-02') accountCode = '5230';
                      if (b.id === 'B-03') accountCode = '5240';
                      if (b.id === 'B-04') accountCode = '5200';
                      
                      setActiveTab('financial_reports');
                      setActiveSidebarItem('financial_reports');
                      handleDrillDownToAccount(accountCode);
                    }}
                    className="w-full mt-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold py-2 rounded-lg text-[10px] shadow-xs flex items-center justify-center gap-1.5 border border-purple-200 transition-colors cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    <span>عرض كشف الحساب والمطابقة الفعلية 📊</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
    </>
  );
};
