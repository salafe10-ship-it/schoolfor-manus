import { BarChart, Calculator, Percent, Receipt, RefreshCw } from 'lucide-react';
import React from 'react';
import { AccountingContext } from '../../../components/GeneralLedgerPortal';
export const CalcToolsTab = () => {
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
  formatCurrency,
  handleCalcPress
} = React.useContext(AccountingContext);

  return (
    <>
      {activeTab === 'calc_tools' && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div>
              <h2 className="text-base font-black text-slate-900">أدوات المصادقة والحسبة اللحظية ومحول العمليات</h2>
              <p className="text-xs text-slate-500 mt-1">الآلة الحاسبة التفاعلية لترحيل مبالغ الفواتير ومطابقة صرف العملة المحلية</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Card 1: Interactive calculator */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-800 text-right space-y-4 shadow-xs">
                <h3 className="font-extrabold text-xs text-indigo-700 tracking-wider">الآلة المحاسبية الرقمية للفرع</h3>
                
                {/* Outscreen displays */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-left font-mono">
                  <div className="text-sm text-slate-400 font-medium tracking-wide leading-none min-h-[16px] overflow-hidden whitespace-nowrap text-right">
                    {calcExpr || '0'}
                  </div>
                  <div className="text-3xl font-black text-emerald-700 mt-2 truncate text-right">
                    {calcResult}
                  </div>
                </div>

                {/* Keyboard grid */}
                <div className="grid grid-cols-4 gap-2">
                  {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', 'C', '+', '='].map(btn => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => handleCalcPress(btn)}
                      className={`py-3.5 rounded-xl font-mono text-sm font-black transition-all cursor-pointer ${
                        btn === '=' ? 'col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' :
                        btn === 'C' ? 'bg-rose-600 hover:bg-rose-700 text-white' :
                        ['/', '*', '-', '+'].includes(btn) ? 'bg-slate-200 hover:bg-slate-300 text-indigo-700' :
                        'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card 2: Currency converter */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-900">محول أسعار الصرف للعملة الأجنبية والمحلية</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">المبلغ المراد تحويله:</label>
                      <input 
                        type="number"
                        value={fxAmount}
                        onChange={(e) => {
                          setFxAmount(e.target.value);
                          const amt = parseFloat(e.target.value);
                          if (!isNaN(amt)) {
                            if (fxFrom === 'SAR') {
                              setFxResult((amt * 1.285).toFixed(2));
                            } else {
                              setFxResult((amt * 0.778).toFixed(2));
                            }
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono font-bold text-slate-900"
                        placeholder="100.00"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">جهة التحويل الحالية:</label>
                      <select 
                        value={fxFrom}
                        onChange={(e) => {
                          const val = e.target.value as 'SAR' | 'LYD';
                          setFxFrom(val);
                          const amt = parseFloat(fxAmount);
                          if (!isNaN(amt)) {
                            if (val === 'SAR') {
                              setFxResult((amt * 1.285).toFixed(2));
                            } else {
                              setFxResult((amt * 0.778).toFixed(2));
                            }
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold"
                      >
                        <option value="SAR">ريال سعودي (SAR) ← دينار ليبي (LYD)</option>
                        <option value="LYD">دينار ليبي (LYD) ← ريال سعودي (SAR)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 flex justify-between items-center shadow-xs">
                  <span className="text-[11px] text-slate-550 font-bold">المقدار المعادل الناتج للعملية:</span>
                  <span className="font-mono text-base font-black text-indigo-700" dir="ltr">
                    {fxResult} {fxFrom === 'SAR' ? 'د.ل' : 'ر.س'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
};
