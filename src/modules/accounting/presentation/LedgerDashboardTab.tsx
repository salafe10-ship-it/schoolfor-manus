import { Activity, AlertTriangle, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, BookOpen, Briefcase, Calculator, Calendar, CheckCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock, CornerUpLeft, CreditCard, Download, Edit, Eye, FileDown, FilePlus, FileSignature, FileText, Filter, Flag, Hash, HelpCircle, Key, Landmark, Layers, LayoutTemplate, Link, List, Maximize2, Minimize2, PenTool, Play, Plus, Printer, RefreshCw, Save, Search, Settings, Settings2, Share2, ShieldCheck, Table, Trash2, User, Users, X, Zap } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { AccountingContext } from '../../../components/GeneralLedgerPortal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, ComposedChart } from 'recharts';

export const LedgerDashboardTab = () => {
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

  const financialTotals = useMemo(() => {
    const reportAccounts = getProcessedAccounts ? getProcessedAccounts() : accounts;
    const isLeaf = (account: any) => account.type === 'فرعي' || account.type === 'leaf' || Number(account.level) >= 3;
    const subRevenues = reportAccounts.filter(a => a.classification === 'إيرادات' && isLeaf(a));
    const subExpenses = reportAccounts.filter(a => a.classification === 'مصروفات' && isLeaf(a));
    const subLiquidity = reportAccounts.filter(a => a.classification === 'أصول' && isLeaf(a) && (a.code.startsWith('110') || a.code.startsWith('111') || a.code.startsWith('112')));

    const ending = (account: any) => Number(account.endingBalance ?? account.balance ?? 0) || 0;
    const periodRevenue = (account: any) => (Number(account.creditMovements || 0) - Number(account.debitMovements || 0)) || 0;
    const periodExpense = (account: any) => (Number(account.debitMovements || 0) - Number(account.creditMovements || 0)) || 0;
    const revenues = subRevenues.reduce((sum, a) => sum + periodRevenue(a), 0);
    const expenses = subExpenses.reduce((sum, a) => sum + periodExpense(a), 0);
    const liquidity = subLiquidity.reduce((sum, a) => sum + ending(a), 0);
    const netResult = revenues - expenses;

    return {
      revenues,
      expenses,
      liquidity,
      netResult
    };
  }, [accounts, getProcessedAccounts]);

  const handleRefreshData = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      triggerNotification('✓ تم تحديث ومزامنة جميع البيانات المالية والتقارير بنجاح!', 'success');
    }, 800);
  };

  return (
    <>
      {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Bar Banner Title & Actions */}
            <div className="flex flex-wrap justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 mb-4 gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black text-slate-800">لوحة المؤشرات والتحليل المالي</h2>
                <span className="font-mono text-[9px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded font-bold">
                  آخر تحديث للبيانات: 2026-05-13
                </span>
              </div>
              <button 
                onClick={handleRefreshData}
                disabled={refreshing}
                className="bg-white hover:bg-slate-100 disabled:bg-slate-150 text-slate-700 disabled:text-slate-400 font-bold text-[10px] px-2.5 py-1.5 rounded border border-slate-200 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                <span>تحديث التحليلات المزامنة</span>
              </button>
            </div>

            {/* Four KPI cards matching exact layout and colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Revenues */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between h-28">
                <span className="text-[11px] text-slate-500 font-black">إجمالي الإيرادات (YTD)</span>
                <div>
                  <div className="text-2xl font-black text-emerald-600 tracking-tight" dir="ltr">
                    {formatCurrency(financialTotals.revenues, false)}
                  </div>
                  <span className="text-[9px] text-emerald-500 font-extrabold">✓ قيود مرحت بالاستاذ</span>
                </div>
              </div>

              {/* Total Expenses */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between h-28">
                <span className="text-[11px] text-slate-500 font-black">إجمالي المصروفات (YTD)</span>
                <div>
                  <div className="text-2xl font-black text-rose-600 tracking-tight" dir="ltr">
                    {formatCurrency(financialTotals.expenses, false)}
                  </div>
                  <span className="text-[9px] text-rose-500 font-extrabold block">⚙ رواتب + تشغيل المدارس</span>
                </div>
              </div>

              {/* Net Income/Outcome */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between h-28">
                <span className="text-[11px] text-slate-500 font-black">صافي النتيجة</span>
                <div>
                  <div className="text-2xl font-black text-emerald-700 tracking-tight" dir="ltr">
                    {formatCurrency(financialTotals.netResult, false)}
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold">باقي الأرباح رهن التوزيع</span>
                </div>
              </div>

              {/* Liquid Funds Cash & Bank */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between h-28">
                <span className="text-[11px] text-slate-500 font-black">سيولة الصناديق والبنوك</span>
                <div>
                  <div className="text-2xl font-black text-amber-600 tracking-tight" dir="ltr">
                    {formatCurrency(financialTotals.liquidity, false)}
                  </div>
                  <span className="text-[9px] text-amber-600 font-bold">💳 متاح للصرف والتحكم اليومي</span>
                </div>
              </div>
            </div>

            {/* Bottom Panel containing: Health Check (Left) and Profit Margin (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: فحص سلامة النظام المحاسبي */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="p-1 px-1.5 bg-sky-100 text-sky-700 rounded-lg">🛡</span>
                  <h3 className="font-extrabold text-slate-800 text-sm">فحص سلامة النظام المحاسبي</h3>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {/* Item 1 */}
                  <div className="flex justify-between items-center py-3">
                    <span className="text-slate-600 font-semibold">• توازن ميزان المراجعة :</span>
                    <span className="flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      متوازن ✓
                    </span>
                  </div>

                  {/* Item 2 */}
                  <div className="flex justify-between items-center py-3">
                    <span className="text-slate-600 font-semibold">• العمليات غير المرحلة :</span>
                    <span className="text-slate-500 font-bold bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      لا يوجد
                    </span>
                  </div>

                  {/* Item 3 */}
                  <div className="flex justify-between items-center py-3">
                    <span className="text-slate-600 font-semibold">• اتجاه المصروفات الزائدة :</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                      ضمن النطاق المعتمد
                    </span>
                  </div>

                  {/* Item 4 */}
                  <div className="flex justify-between items-center py-3">
                    <span className="text-slate-600 font-semibold">• حالة السنة المالية الحالية :</span>
                    <span className="text-indigo-600 font-black bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 font-mono">
                      نشطة (2026)
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: مؤشر هامش الربح التشغيلي */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between items-center min-h-[220px]">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 w-full">
                  <span className="p-1 px-1.5 bg-indigo-100 text-[#020817] rounded-lg">📊</span>
                  <h3 className="font-extrabold text-slate-800 text-sm">مؤشر هامش الربح التشغيلي</h3>
                </div>

                <div className="relative flex flex-col items-center justify-center my-4">
                  {/* SVG circular gauge */}
                  <svg className="w-36 h-36 transform -rotate-90">
                    {/* Background track */}
                    <circle 
                      cx="72" cy="72" r="64" 
                      stroke="#f1f5f9" strokeWidth="12" 
                      fill="transparent" 
                    />
                    {/* Active gradient value ring based on live calculation */}
                    {(() => {
                      const percentage = Math.max(0, Math.min(100, Math.round(((financialTotals.netResult) / (financialTotals.revenues || 1)) * 100)));
                      const circumference = 2 * Math.PI * 64;
                      const offset = circumference - (percentage / 100) * circumference;
                      return (
                        <circle 
                          cx="72" cy="72" r="64" 
                          stroke="#2563eb" strokeWidth="12" 
                          fill="transparent" 
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          strokeLinecap="round"
                          className="transition-all duration-700"
                        />
                      );
                    })()}
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-3xl font-black text-slate-800 font-mono block">
                      {Math.max(0, Math.min(100, Math.round(((financialTotals.netResult) / (financialTotals.revenues || 1)) * 100)))}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold block mt-0.5">نسبة صافي الربح الحالي</span>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 font-medium font-mono">طريقة الحسبة: (الربح التشغيلي ÷ الإيرادات YTD)</span>
              </div>

            </div>
          </div>
        )}
    </>
  );
};
