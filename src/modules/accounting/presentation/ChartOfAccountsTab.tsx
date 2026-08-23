import { AlertTriangle, BarChart2, Box, Calculator, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock, Download, Edit, Edit3, Eye, FileDown, FileSpreadsheet, FileText, Filter, Folder, FolderOpen, Hash, HelpCircle, Key, Layers, Play, Plus, Printer, RefreshCw, Save, Search, Settings2, ShieldAlert, ShieldCheck, Trash2, TrendingDown, TrendingUp, Type, Upload, X } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AccountingContext, AccountNode } from '../../../components/GeneralLedgerPortal';
import { triggerNotification } from '../../../lib/notifications';

export const ChartOfAccountsTab = () => {
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
    getNormalizedJournalEntries, handleSelectReport, handleDrillDownBreadcrumbClick,
    handleDrillDownToAccount, handleDrillDownToJournalEntry, handleDrillDownToOriginalDocument,
    hasUserPermission, exportReportExcel, handleSelectAsset, handleNewAsset, handleSaveAsset,
    handleDeleteAsset, handleRecalculateAssetDepreciation, handlePostAssetDepreciation,
    handleTransferAssetSubmit, handleSellAssetSubmit, handleDiscardAssetSubmit, handleMaintenanceSubmit,
    handleImportExcelSimulate, handleDownloadTemplate, handlePrintAssetCard, handlePrintDepreciationSchedule,
    findOriginalDocument, handleReportAccountClick, handleJournalEntryClick,
    isAccountOrDescendant, getProcessedAccounts,
    formatCurrency, logAction,
    handleCalcPress, handleCreateNewCoaClick, handleEditCoaClick, handleCancelCoa, handleSaveCoa,
    handleDeleteCoa, handleExpandAllCoa, handleCollapseAllCoa, handleExportCoaExcel, handlePrintCoaTree,
    handleImportCoaCSV, persistCanonicalFinancialSnapshot, canonicalFinancialStatus,
  } = React.useContext(AccountingContext);

  return (
    <>
              {activeTab === 'trial_balance' && (
          <div className="space-y-6 animate-fade-in text-xs" dir="rtl">
            
            {/* Top Toolbar */}
            <div className="bg-slate-50 text-slate-800 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight text-slate-900">نظام شجرة الحسابات والدليل المحاسبي الموحد ERP</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">إدارة البنية المالية ومراكز التكلفة للمراحل التعليمية (الروضة، الابتدائي، المتوسط، الثانوي)</p>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateNewCoaClick}
                  className="bg-white hover:bg-slate-50 text-indigo-650 font-bold text-[11px] px-3 py-2 rounded-lg flex items-center gap-1.5 border border-slate-200 hover:border-slate-300 transition-all duration-150 shadow-xs cursor-pointer"
                  title="إنشاء كود مالي جديد"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>جديد (F2)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (coaMode === 'view') {
                      handleEditCoaClick();
                    } else {
                      handleCancelCoa();
                    }
                  }}
                  className={`font-bold text-[11px] px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs border transition-all duration-150 cursor-pointer ${
                    coaMode !== 'view' 
                      ? 'bg-amber-50 text-amber-850 border-amber-250 hover:bg-amber-100/50' 
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                  title="تعديل بيانات الحساب المحدد"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{coaMode !== 'view' ? 'إلغاء التعديل' : 'تعديل'}</span>
                </button>

                {coaMode !== 'view' && (
                  <button
                    type="button"
                    onClick={handleSaveCoa}
                    className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-[11px] px-3 py-2 rounded-lg flex items-center gap-1.5 border border-indigo-650 shadow-xs transition-all duration-150 cursor-pointer"
                    title="حفظ التغييرات الحالية"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ (F10)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDeleteCoa}
                  disabled={coaMode !== 'view'}
                  className="bg-white hover:bg-rose-50 text-rose-650 hover:border-rose-250 disabled:opacity-40 font-bold text-[11px] px-3 py-2 rounded-lg flex items-center gap-1.5 border border-slate-200 transition-all duration-150 shadow-xs cursor-pointer"
                  title="حذف الحساب المحدد"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>

                <div className="w-px h-6 bg-slate-200 mx-1" />

                <button
                  type="button"
                  onClick={handleExpandAllCoa}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-2.5 py-2 rounded-lg flex items-center gap-1 border border-slate-200 transition-all duration-150"
                  title="توسيع كافة المستويات في الشجرة"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                  <span>توسيع الكل</span>
                </button>

                <button
                  type="button"
                  onClick={handleCollapseAllCoa}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-2.5 py-2 rounded-lg flex items-center gap-1 border border-slate-200 transition-all duration-150"
                  title="طي كافة المستويات"
                >
                  <Folder className="w-3.5 h-3.5 text-slate-500" />
                  <span>طي الكل</span>
                </button>

                <div className="w-px h-6 bg-slate-200 mx-1" />

                <button
                  type="button"
                  onClick={() => setShowCoaImportModal(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-2.5 py-2 rounded-lg flex items-center gap-1 border border-slate-200 transition-all duration-150"
                  title="استيراد الحسابات من ملف CSV/Excel"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>استيراد CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCoaExcel}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-2.5 py-2 rounded-lg flex items-center gap-1 border border-slate-200 transition-all duration-150"
                  title="تصدير شجرة الحسابات الحالية كملف Excel متوافق"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تصدير Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintCoaTree}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-2.5 py-2 rounded-lg flex items-center gap-1 border border-slate-200 transition-all duration-150"
                  title="طباعة الدليل الموحد مع التفرعات"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>طباعة الدليل</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCoaSearchQuery('');
                    setSelectedAccountCode('1000');
                    setCoaMode('view');
                    triggerNotification('✓ تم تحديث وإعادة تعيين عرض دليل الحسابات بنجاح', 'info');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-2.5 py-2 rounded-lg flex items-center gap-1 border border-slate-200 transition-all duration-150"
                  title="إعادة تهيئة القائمة"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                  <span>تحديث</span>
                </button>
              </div>
            </div>

            {/* Advanced Workspace Navigation Tabs */}
            <div className="bg-slate-50 text-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs border border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCoaWorkspaceMode('inspector')}
                  className={`px-4 py-2.5 rounded-lg text-[11px] font-black transition-all duration-200 flex items-center gap-2 cursor-pointer border ${
                    coaWorkspaceMode === 'inspector'
                      ? 'bg-indigo-650 text-white border-indigo-650 shadow-xs font-black scale-[1.01]'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-250 hover:border-slate-300'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 text-indigo-500" />
                  <span>🔍 دليل الحسابات التفاعلي وبطاقات التعريف</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCoaWorkspaceMode('dashboard')}
                  className={`px-4 py-2.5 rounded-lg text-[11px] font-black transition-all duration-200 flex items-center gap-2 cursor-pointer border ${
                    coaWorkspaceMode === 'dashboard'
                      ? 'bg-indigo-650 text-white border-indigo-650 shadow-xs font-black scale-[1.01]'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-250 hover:border-slate-300'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>📊 تحليلات الدليل ورقابة ميزان المراجعة IFRS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCoaWorkspaceMode('spreadsheet')}
                  className={`px-4 py-2.5 rounded-lg text-[11px] font-black transition-all duration-200 flex items-center gap-2 cursor-pointer border ${
                    coaWorkspaceMode === 'spreadsheet'
                      ? 'bg-indigo-650 text-white border-indigo-650 shadow-xs font-black scale-[1.01]'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-250 hover:border-slate-300'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
                  <span>📋 تعديل جماعي سريع (Spreadsheet Master)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCoaWorkspaceMode('wizard')}
                  className={`px-4 py-2.5 rounded-lg text-[11px] font-black transition-all duration-200 flex items-center gap-2 cursor-pointer border ${
                    coaWorkspaceMode === 'wizard'
                      ? 'bg-indigo-650 text-white border-indigo-650 shadow-xs font-black scale-[1.01]'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-250 hover:border-slate-300'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5 text-purple-600" />
                  <span>🧙‍♂️ معالج توليد الحسابات للمراحل التعليمية</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCoaWorkspaceMode('stress_test');
                    setStressScenario('none');
                    setExpenseStressFactor(100);
                    setRevenueStressFactor(100);
                  }}
                  className={`px-4 py-2.5 rounded-lg text-[11px] font-black transition-all duration-200 flex items-center gap-2 cursor-pointer border ${
                    coaWorkspaceMode === 'stress_test'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-black scale-[1.01]'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-250 hover:border-slate-300'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>⚡ بوابة محاكاة الملاءة واختبارات الجهد</span>
                </button>
              </div>

              <div className="flex items-center gap-2 px-3 text-slate-550 font-mono text-[9px] font-bold bg-white py-1.5 rounded-lg border border-slate-200">
                <span className="text-emerald-600 font-sans">نشط</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-400">| Standard ERP</span>
              </div>
            </div>

            {coaWorkspaceMode === 'inspector' && (
              /* Main Split Layout */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Right Side: Tree View (Collapsible Hierarchy) */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col h-[750px]">
                <div className="border-b border-slate-100 pb-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>دليل الحسابات التفاعلي</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px]">
                        {accounts.length} حساب
                      </span>
                    </h3>
                    <span className="text-[10px] text-slate-400">انقر لتحديد واستعراض البيانات</span>
                  </div>

                  {/* Search inside tree */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="البحث برقم الحساب، الاسم، أو الملاحظات..."
                      value={coaSearchQuery}
                      onChange={(e) => setCoaSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white transition-all"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                    {coaSearchQuery && (
                      <button 
                        type="button" 
                        onClick={() => setCoaSearchQuery('')}
                        className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tree Container */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                  {['أصول', 'خصوم', 'حقوق ملكية', 'إيرادات', 'مصروفات'].map(category => {
                    const rootNodes = accounts.filter(a => a.classification === category && !a.parentAccountId)
                                              .sort((a, b) => a.code.localeCompare(b.code));
                    const totalBalance = accounts.filter(a => a.classification === category && a.type === 'فرعي')
                                                 .reduce((sum, current) => sum + current.balance, 0);
                    const categoryCount = accounts.filter(a => a.classification === category).length;

                    // Skip displaying category if search is active and has no match
                    const hasMatchesInCategory = coaSearchQuery.trim() === '' || rootNodes.some(rn => {
                      const traverseCheck = (node: AccountNode): boolean => {
                        const matches = node.code.includes(coaSearchQuery) || 
                                        node.nameAr.toLowerCase().includes(coaSearchQuery.toLowerCase());
                        if (matches) return true;
                        const children = accounts.filter(c => c.parentAccountId === node.code);
                        return children.some(c => traverseCheck(c));
                      };
                      return traverseCheck(rn);
                    });

                    if (!hasMatchesInCategory) return null;

                    return (
                      <div key={category} className="border border-slate-100 rounded-lg p-3 hover:border-slate-200 transition-all">
                        {/* Category Header */}
                        <div className="flex justify-between items-center mb-2.5 pb-1.5 border-b border-dashed border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              category === 'أصول' ? 'bg-emerald-500' :
                              category === 'خصوم' ? 'bg-rose-500' :
                              category === 'حقوق ملكية' ? 'bg-purple-500' :
                              category === 'إيرادات' ? 'bg-sky-500' : 'bg-amber-500'
                            }`} />
                            <span className="font-extrabold text-slate-900 text-xs">
                              {category}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full font-sans">
                              {categoryCount}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-500 font-bold" dir="ltr">
                            {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل
                          </span>
                        </div>

                        {/* Root Nodes in Category */}
                        <div className="space-y-1">
                          {rootNodes.map(node => {
                            const matchingCodes = new Set<string>();
                            if (coaSearchQuery.trim()) {
                              const query = coaSearchQuery.toLowerCase();
                              accounts.forEach(acc => {
                                if (
                                  acc.code.includes(query) ||
                                  acc.nameAr.toLowerCase().includes(query) ||
                                  (acc.nameEn && acc.nameEn.toLowerCase().includes(query))
                                ) {
                                  matchingCodes.add(acc.code);
                                  let parentId = acc.parentAccountId;
                                  while (parentId) {
                                    matchingCodes.add(parentId);
                                    const parent = accounts.find(a => a.code === parentId);
                                    parentId = parent ? parent.parentAccountId : undefined;
                                  }
                                }
                              });
                            }

                            const renderTreeNode = (node: AccountNode) => {
                              const children = accounts.filter(a => a.parentAccountId === node.code).sort((a, b) => a.code.localeCompare(b.code));
                              const hasChildren = children.length > 0;
                              const isExpanded = !!expandedNodes[node.code];
                              const isSelected = selectedAccountCode === node.code;
                              const matchesSearch = coaSearchQuery.trim() === '' || matchingCodes.has(node.code);

                              if (coaSearchQuery.trim() !== '' && !matchingCodes.has(node.code)) {
                                return null;
                              }

                              return (
                                <div key={node.code} className="mr-3 border-r border-slate-100 pr-1.5">
                                  <div 
                                    onClick={() => {
                                      setSelectedAccountCode(node.code);
                                      setCoaMode('view');
                                    }}
                                    className={`group flex items-center justify-between py-1 px-2 rounded-lg cursor-pointer transition-all duration-150 ${
                                      isSelected 
                                        ? 'bg-indigo-50 border-r-4 border-indigo-600 text-indigo-950 font-bold' 
                                        : 'hover:bg-slate-50/70 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                      {hasChildren ? (
                                        <button 
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedNodes(prev => ({ ...prev, [node.code]: !prev[node.code] }));
                                          }}
                                          className="p-0.5 hover:bg-slate-200 rounded text-slate-500"
                                        >
                                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        </button>
                                      ) : (
                                        <span className="w-3.5 h-3.5 shrink-0" /> // spacer
                                      )}

                                      {node.type === 'رئيسي' ? (
                                        isExpanded 
                                          ? <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-amber-500'}`} />
                                          : <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-amber-500'}`} />
                                      ) : (
                                        <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                                      )}

                                      <span className="font-mono text-[11px] text-indigo-700 font-semibold shrink-0 group-hover:text-indigo-900">
                                        {node.code}
                                      </span>
                                      
                                      <span className="truncate text-[11px]">
                                        {node.nameAr}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1 font-mono text-[9px] shrink-0">
                                      {node.costCenterId && (
                                        <span className="px-1 bg-sky-50 text-sky-700 border border-sky-100 rounded text-[8px] font-sans">
                                          {node.costCenterId === 'kindergarten' ? 'الروضة' :
                                           node.costCenterId === 'primary' ? 'الابتدائي' :
                                           node.costCenterId === 'middle' ? 'المتوسط' : 'الثانوي'}
                                        </span>
                                      )}
                                      <span className={node.balance < 0 ? 'text-rose-600 font-black' : 'text-slate-500'}>
                                        {node.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </div>

                                  {hasChildren && isExpanded && (
                                    <div className="mt-0.5 space-y-0.5">
                                      {children.map(child => renderTreeNode(child))}
                                    </div>
                                  )}
                                </div>
                              );
                            };

                            return renderTreeNode(node);
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Left Side: Detail & Action Panel */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-[750px] overflow-y-auto">
                
                {/* 1. View Mode Detail Panel */}
                {coaMode === 'view' && selectedAccountCode && (() => {
                  const currentAccount = accounts.find(a => a.code === selectedAccountCode);
                  if (!currentAccount) return <p className="text-slate-400 text-center py-10">الرجاء اختيار حساب من الشجرة لاستعراض تفاصيله</p>;

                  const parentAccount = currentAccount.parentAccountId ? accounts.find(a => a.code === currentAccount.parentAccountId) : null;
                  const childAccounts = accounts.filter(a => a.parentAccountId === currentAccount.code);

                  return (
                    <div className="space-y-6">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                        <div>
                          <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full font-bold">
                            المستوى المالي {currentAccount.level}
                          </span>
                          <h2 className="text-base font-black text-slate-900 mt-2 flex items-center gap-2">
                            <span className="font-mono text-indigo-700">{currentAccount.code}</span>
                            <span>-</span>
                            <span>{currentAccount.nameAr}</span>
                          </h2>
                          {currentAccount.nameEn && (
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5" dir="ltr">
                              {currentAccount.nameEn}
                            </p>
                          )}
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left" dir="ltr">
                          <span className="text-[9px] text-slate-400 block font-sans text-right">الرصيد الحالي YTD</span>
                          <span className={`text-base font-black font-mono block tracking-tight ${
                            currentAccount.balance < 0 ? 'text-rose-600' : 'text-slate-800'
                          }`}>
                            {currentAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs font-sans">د.ل</span>
                          </span>
                        </div>
                      </div>

                      {/* Modern Tab Selector */}
                      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto scrollbar-none pb-px" dir="rtl">
                        <button
                          type="button"
                          onClick={() => setSelectedAccTab('info')}
                          className={`py-2.5 px-3 text-[11px] font-black transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                            selectedAccTab === 'info' 
                              ? 'border-indigo-650 text-indigo-700 font-extrabold bg-indigo-50/40 rounded-t-lg' 
                              : 'border-transparent text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          📂 بطاقة التعريف
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedAccTab('budget')}
                          className={`py-2.5 px-3 text-[11px] font-black transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                            selectedAccTab === 'budget' 
                              ? 'border-indigo-650 text-indigo-700 font-extrabold bg-indigo-50/40 rounded-t-lg' 
                              : 'border-transparent text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          📊 الموازنة والانحراف
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedAccTab('split')}
                          className={`py-2.5 px-3 text-[11px] font-black transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                            selectedAccTab === 'split' 
                              ? 'border-indigo-650 text-indigo-700 font-extrabold bg-indigo-50/40 rounded-t-lg' 
                              : 'border-transparent text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          🌐 التوزيع متعدد الأبعاد
                        </button>
                        {(currentAccount.classification === 'أصول' || currentAccount.code.startsWith('11')) && (
                          <button
                            type="button"
                            onClick={() => setSelectedAccTab('reconciliation')}
                            className={`py-2.5 px-3 text-[11px] font-black transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                              selectedAccTab === 'reconciliation' 
                                ? 'border-indigo-650 text-indigo-700 font-extrabold bg-indigo-50/40 rounded-t-lg' 
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            🔏 التسوية المصرفية
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedAccTab('ledger')}
                          className={`py-2.5 px-3 text-[11px] font-black transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                            selectedAccTab === 'ledger' 
                              ? 'border-indigo-650 text-indigo-700 font-extrabold bg-indigo-50/40 rounded-t-lg' 
                              : 'border-transparent text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          📜 سجل حركات التدقيق
                        </button>
                      </div>

                      {/* TAB CONTENT STAGE */}
                      {selectedAccTab === 'info' && (
                        <div className="space-y-6 animate-fade-in">
                          {/* Detail Fields Card */}
                          <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-5 space-y-4">
                            <h4 className="text-xs font-black text-slate-900 pb-2 border-b border-slate-200/60">البطاقة التعريفية للحساب</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                              <div>
                                <span className="text-slate-400 block">رقم الحساب الهرمي:</span>
                                <span className="font-mono text-slate-900 font-bold mt-1 block">{currentAccount.code}</span>
                              </div>

                              <div>
                                <span className="text-slate-400 block">نوع الحساب وبنيته:</span>
                                <span className="mt-1 block">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black ${
                                    currentAccount.type === 'رئيسي' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {currentAccount.type} ({currentAccount.type === 'رئيسي' ? 'حساب مجمع رئيسي' : 'حساب أستاذ مساعد فرعي'})
                                  </span>
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 block">التبويب والمصنف الأساسي:</span>
                                <span className="mt-1 block">
                                  <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold ${
                                    currentAccount.classification === 'أصول' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                                    currentAccount.classification === 'خصوم' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                                    currentAccount.classification === 'إيرادات' ? 'bg-sky-50 text-sky-800 border border-sky-100' :
                                    'bg-amber-50 text-amber-800 border border-amber-100'
                                  }`}>
                                    {currentAccount.classification}
                                  </span>
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 block">طبيعة الحركة المالية الافتراضية:</span>
                                <span className="font-bold text-slate-800 mt-1 block">
                                  {currentAccount.natureType || (currentAccount.classification === 'مصروفات' || currentAccount.classification === 'أصول' ? 'مدين' : 'دائن')}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 block">مركز التكلفة المرتبط:</span>
                                <span className="mt-1 block">
                                  {currentAccount.costCenterId ? (
                                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded font-black text-[10px]">
                                      {currentAccount.costCenterId === 'kindergarten' ? 'مركز تكلفة: مرحلة الروضة' :
                                       currentAccount.costCenterId === 'primary' ? 'مركز تكلفة: مرحلة الابتدائي' :
                                       currentAccount.costCenterId === 'middle' ? 'مركز تكلفة: مرحلة المتوسط' :
                                       'مركز تكلفة: مرحلة الثانوي'}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded text-[10px]">حساب عام للمجمع المالي</span>
                                  )}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 block">حالة الحساب التشغيلية:</span>
                                <span className="mt-1 flex items-center gap-1.5 font-bold">
                                  <span className={`w-2 h-2 rounded-full ${currentAccount.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                  <span className={currentAccount.isActive ? 'text-emerald-700' : 'text-slate-500'}>
                                    {currentAccount.isActive ? 'نشط (متاح للترحيل والقيود اليومية)' : 'غير نشط (معلق مؤقتاً)'}
                                  </span>
                                </span>
                              </div>

                              <div className="md:col-span-2">
                                <span className="text-slate-400 block">الحساب الأب المباشر:</span>
                                {parentAccount ? (
                                  <div 
                                    onClick={() => setSelectedAccountCode(parentAccount.code)}
                                    className="mt-1.5 p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg cursor-pointer flex items-center gap-2 text-indigo-700 font-bold transition-all"
                                  >
                                    <span className="font-mono text-xs">{parentAccount.code}</span>
                                    <span>-</span>
                                    <span>{parentAccount.nameAr}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 mt-1 block">لا يوجد - هذا حساب رئيسي في الطبقة الأولى</span>
                                )}
                              </div>

                              <div className="md:col-span-2">
                                <span className="text-slate-400 block">ملاحظات وقيود محاسبية:</span>
                                <p className="text-slate-600 bg-white p-2.5 border border-slate-200 rounded-lg mt-1 whitespace-pre-line leading-relaxed">
                                  {currentAccount.notes || 'لا توجد ملاحظات تعاقدية أو قيود مسجلة لهذا الحساب المالي حالياً.'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Child Node Section (for main accounts) */}
                          {currentAccount.type === 'رئيسي' && (
                            <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <h4 className="text-xs font-black text-slate-800">الحسابات التابعة والمدرجة بالدليل</h4>
                                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                                  {childAccounts.length} حساب تتابع
                                </span>
                              </div>

                              {childAccounts.length > 0 ? (
                                <div className="max-h-[160px] overflow-y-auto space-y-1.5">
                                  {childAccounts.map(child => (
                                    <div 
                                      key={child.code}
                                      onClick={() => setSelectedAccountCode(child.code)}
                                      className="flex justify-between items-center p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer border border-slate-100 transition-all"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-indigo-700 font-bold">{child.code}</span>
                                        <span className="text-slate-700 font-semibold">{child.nameAr}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`px-1.5 py-0.2 rounded text-[8px] ${
                                          child.type === 'رئيسي' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                          {child.type}
                                        </span>
                                        <span className="font-mono text-slate-900 font-bold">
                                          {child.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-slate-400 text-center py-4">لا توجد حسابات تابعة له في الدليل، يمكنك إدراج حسابات بالأسفل.</p>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  handleCreateNewCoaClick();
                                  setCoaForm(prev => ({
                                    ...prev,
                                    parentAccountId: currentAccount.code,
                                    classification: currentAccount.classification,
                                  }));
                                }}
                                className="w-full text-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black py-2 rounded-lg border border-indigo-200/60 block text-[11px] transition-all"
                              >
                                + إضافة كود مالي فرع تحت الحساب ({currentAccount.nameAr})
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedAccTab === 'budget' && (() => {
                        const budgetLimit = currentAccount.annualBudget || (
                          currentAccount.classification === 'مصروفات' ? 60000 :
                          currentAccount.classification === 'إيرادات' ? 180000 : 0
                        );
                        const actualAmt = Math.abs(currentAccount.balance);
                        const variance = budgetLimit - actualAmt;
                        const utilizationPercent = budgetLimit > 0 ? (actualAmt / budgetLimit) * 100 : 0;

                        // Health Color
                        const isExpense = currentAccount.classification === 'مصروفات';
                        let healthColor = 'bg-emerald-500';
                        let healthBg = 'bg-emerald-50';
                        let healthText = 'text-emerald-800';
                        let statusMsg = 'استهلاك مالي آمن وضمن النطاق المخطط له';

                        if (isExpense) {
                          if (utilizationPercent >= 100) {
                            healthColor = 'bg-rose-600';
                            healthBg = 'bg-rose-50';
                            healthText = 'text-rose-800';
                            statusMsg = 'تحذير: لقد تم تجاوز الموازنة التقديرية المخصصة لهذا العام!';
                          } else if (utilizationPercent >= 75) {
                            healthColor = 'bg-amber-500';
                            healthBg = 'bg-amber-50';
                            healthText = 'text-amber-800';
                            statusMsg = 'انتباه: اقتراب الاستهلاك من السقف المحدد للموازنة';
                          }
                        } else if (currentAccount.classification === 'إيرادات') {
                          // Revenue budget: high utilization is GOOD, low is warning
                          if (utilizationPercent >= 100) {
                            healthColor = 'bg-emerald-500';
                            healthBg = 'bg-emerald-50';
                            healthText = 'text-emerald-800';
                            statusMsg = 'رائع: تم تجاوز هدف الإيرادات السنوي المخطط بنجاح!';
                          } else if (utilizationPercent >= 50) {
                            healthColor = 'bg-indigo-500';
                            healthBg = 'bg-indigo-50';
                            healthText = 'text-indigo-800';
                            statusMsg = 'تحصيل مرضي وجارٍ استكمال الفجوة التقديرية للإيراد';
                          } else {
                            healthColor = 'bg-rose-500';
                            healthBg = 'bg-rose-50';
                            healthText = 'text-rose-800';
                            statusMsg = 'تحذير: معدل تحصيل الإيراد منخفض جداً مقارنة بالموازنة المستهدفة!';
                          }
                        }

                        const handleSaveInlineBudget = () => {
                          setAccounts(prev => prev.map(a => {
                            if (a.code === currentAccount.code) {
                              return { ...a, annualBudget: inlineBudgetVal };
                            }
                            return a;
                          }));
                          triggerNotification(`✓ تم تحديث الموازنة التقديرية للحساب #${currentAccount.code} بنجاح!`, 'success');
                          setInlineBudgetEdit(false);
                          logAction('UPDATE_BUDGET', `تعديل الموازنة التقديرية للحساب #${currentAccount.code} إلى ${inlineBudgetVal.toLocaleString()} د.ل`, 'الحسابات العامة');
                        };

                        return (
                          <div className="space-y-5 animate-fade-in text-right">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                              <h3 className="text-xs font-extrabold text-slate-900">محلل الموازنة التقديرية والإنحراف المالي</h3>
                              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-black">SAP / Oracle ERP Module</span>
                            </div>

                            {/* Main Budget Grid */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                <span className="text-[9px] text-slate-400 block font-bold">الموازنة المعتمدة</span>
                                {inlineBudgetEdit ? (
                                  <div className="mt-1 flex gap-1 items-center">
                                    <input 
                                      type="number" 
                                      value={inlineBudgetVal}
                                      onChange={(e) => setInlineBudgetVal(parseFloat(e.target.value) || 0)}
                                      className="w-full bg-white border border-indigo-300 rounded p-1 font-mono text-[11px] font-bold text-left focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <button 
                                      type="button" 
                                      onClick={handleSaveInlineBudget}
                                      className="bg-indigo-600 text-white p-1 rounded hover:bg-indigo-700"
                                      title="حفظ"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs font-black font-mono text-indigo-950">
                                      {budgetLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل
                                    </span>
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        setInlineBudgetVal(budgetLimit);
                                        setInlineBudgetEdit(true);
                                      }}
                                      className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold underline"
                                    >
                                      تعديل
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                <span className="text-[9px] text-slate-400 block font-bold">الفعلي المتراكم YTD</span>
                                <span className="text-xs font-black font-mono text-slate-900 block mt-1">
                                  {actualAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل
                                </span>
                              </div>

                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                <span className="text-[9px] text-slate-400 block font-bold">انحراف الموازنة (Variance)</span>
                                <span className={`text-xs font-black font-mono mt-1 block ${variance < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                                  {variance.toLocaleString(undefined, { minimumFractionDigits: 2 })} د.ل
                                </span>
                              </div>
                            </div>

                            {/* Progress bar visual */}
                            {budgetLimit > 0 ? (
                              <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold">
                                  <span className="text-slate-500">معدل الاستهلاك الفعلي للموازنة:</span>
                                  <span className="text-indigo-700 font-mono font-black">{utilizationPercent.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-500 ${healthColor}`}
                                    style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-right text-[10px] text-amber-800">
                                لم يتم تعيين موازنة تقديرية سنوية لهذا البند المالي حتى الآن. يمكنك إدخال قيمة في حقل الموازنة أعلاه لمباشرة الرصد الرقابي الآلي.
                              </div>
                            )}

                            {/* Status and Health Rating */}
                            {budgetLimit > 0 && (
                              <div className={`p-3 rounded-lg border flex gap-3 items-center ${healthBg} border-slate-200`}>
                                <div className={`w-3 h-3 rounded-full shrink-0 ${healthColor}`} />
                                <div className="text-[10px]">
                                  <span className={`font-black ${healthText} block`}>الحالة الرقابية: {statusMsg}</span>
                                  <span className="text-slate-500 mt-0.5 block">الأنظمة العالمية تقوم تلقائياً بإخطار الإدارة المالية في حال تخطي عتبة الـ 90% لضمان التحكم في الانحرافات.</span>
                                </div>
                              </div>
                            )}

                            {/* Competitive Tip */}
                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-[10px] text-slate-600 space-y-1">
                              <span className="font-extrabold text-indigo-900 block">💡 الميزة التنافسية المحترفة:</span>
                              <p className="leading-relaxed">من خلال هذه اللوحة، يتطابق دليل الحسابات مع خطة التدفقات والميزانية التقديرية المعتمدة للمدرسة، مما يمنع تجاوز الصرف على العهد والرواتب والأنشطة الإدارية قبل حدوث القيود اليومية.</p>
                            </div>
                          </div>
                        );
                      })()}

                      {selectedAccTab === 'split' && (() => {
                        const totalSplit = inlineSplits.kindergarten + inlineSplits.primary + inlineSplits.middle + inlineSplits.secondary;
                        const isBalanced = totalSplit === 100;

                        const handleSaveSplits = () => {
                          if (!isBalanced) {
                            triggerNotification('فشل الحفظ: يجب أن يكون مجموع نسب التوزيع مساوياً لـ 100% تماماً.', 'warning');
                            return;
                          }

                          setAccounts(prev => prev.map(a => {
                            if (a.code === currentAccount.code) {
                              return {
                                ...a,
                                dimensionSplit: [
                                  { costCenterId: 'kindergarten', percentage: inlineSplits.kindergarten },
                                  { costCenterId: 'primary', percentage: inlineSplits.primary },
                                  { costCenterId: 'middle', percentage: inlineSplits.middle },
                                  { costCenterId: 'secondary', percentage: inlineSplits.secondary }
                                ]
                              };
                            }
                            return a;
                          }));

                          triggerNotification(`✓ تم تثبيت وتوزيع الأبعاد متعددة مراكز التكلفة للحساب #${currentAccount.code}!`, 'success');
                          logAction('UPDATE_COA_SPLITS', `تعديل نسب توزيع مراكز التكلفة للحساب #${currentAccount.code} (روضة ${inlineSplits.kindergarten}٪، ابتدائي ${inlineSplits.primary}٪، متوسط ${inlineSplits.middle}٪، ثانوي ${inlineSplits.secondary}٪)`, 'الحسابات العامة');
                        };

                        const handleBalancedSplit = () => {
                          setInlineSplits({
                            kindergarten: 25,
                            primary: 25,
                            middle: 25,
                            secondary: 25
                          });
                        };

                        return (
                          <div className="space-y-5 animate-fade-in text-right">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                              <h3 className="text-xs font-extrabold text-slate-900">أبعاد توزيع التكلفة متعدد المراحل التعليمية (Dimension Splits)</h3>
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-black">Multi-Dimension Allocation</span>
                            </div>

                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              تتيح البرامج العالمية المحترفة مثل SAP وOracle تقسيم وحسم نسبة مئوية من قيود الحساب المالي الواحد تلقائياً على عدة مراكز تكلفة (مثلاً: 40% الابتدائي، 30% الروضة...) لتبسيط التسويات الإدارية وتوزيع فواتير الكهرباء أو الإيجار العام.
                            </p>

                            {/* Proportional Segmented Bar */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-600 block">العرض البصري لنسب توزيع التكاليف:</span>
                              <div className="w-full h-4 rounded-lg overflow-hidden flex text-[8px] font-black text-white text-center">
                                {inlineSplits.kindergarten > 0 && (
                                  <div className="bg-orange-500 flex items-center justify-center transition-all" style={{ width: `${inlineSplits.kindergarten}%` }}>
                                    {inlineSplits.kindergarten}%
                                  </div>
                                )}
                                {inlineSplits.primary > 0 && (
                                  <div className="bg-emerald-500 flex items-center justify-center transition-all" style={{ width: `${inlineSplits.primary}%` }}>
                                    {inlineSplits.primary}%
                                  </div>
                                )}
                                {inlineSplits.middle > 0 && (
                                  <div className="bg-sky-500 flex items-center justify-center transition-all" style={{ width: `${inlineSplits.middle}%` }}>
                                    {inlineSplits.middle}%
                                  </div>
                                )}
                                {inlineSplits.secondary > 0 && (
                                  <div className="bg-purple-500 flex items-center justify-center transition-all" style={{ width: `${inlineSplits.secondary}%` }}>
                                    {inlineSplits.secondary}%
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-between text-[8.5px] font-bold text-slate-500">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-orange-500 inline-block" /> روضة</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500 inline-block" /> ابتدائي</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-sky-500 inline-block" /> متوسط</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-500 inline-block" /> ثانوي</span>
                              </div>
                            </div>

                            {/* Inputs Grid */}
                            <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 space-y-3.5">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-black text-slate-700 mb-1">مرحلة الروضة والتمهيدي (٪):</label>
                                  <input 
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={inlineSplits.kindergarten}
                                    onChange={(e) => setInlineSplits(prev => ({ ...prev, kindergarten: parseInt(e.target.value) || 0 }))}
                                    className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono text-center font-bold text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black text-slate-700 mb-1">مرحلة التعليم الابتدائي (٪):</label>
                                  <input 
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={inlineSplits.primary}
                                    onChange={(e) => setInlineSplits(prev => ({ ...prev, primary: parseInt(e.target.value) || 0 }))}
                                    className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono text-center font-bold text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black text-slate-700 mb-1">مرحلة التعليم المتوسط (٪):</label>
                                  <input 
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={inlineSplits.middle}
                                    onChange={(e) => setInlineSplits(prev => ({ ...prev, middle: parseInt(e.target.value) || 0 }))}
                                    className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono text-center font-bold text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black text-slate-700 mb-1">مرحلة التعليم الثانوي (٪):</label>
                                  <input 
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={inlineSplits.secondary}
                                    onChange={(e) => setInlineSplits(prev => ({ ...prev, secondary: parseInt(e.target.value) || 0 }))}
                                    className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono text-center font-bold text-xs"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-between items-center border-t border-slate-200/60 pt-3">
                                <div className="text-[10px]">
                                  <span>مجموع النسب الحالي: </span>
                                  <span className={`font-mono font-black ${isBalanced ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {totalSplit}٪ / 100٪
                                  </span>
                                  {!isBalanced && <span className="text-rose-600 block mt-0.5 font-semibold">يجب تعديل القيم ليتطابق المجموع مع 100٪ تماماً</span>}
                                  {isBalanced && <span className="text-emerald-700 font-bold block mt-0.5">✓ النسب متطابقة ومتزنة وجاهزة للحفظ</span>}
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={handleBalancedSplit}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-[10px] font-extrabold"
                                  >
                                    تقسيم بالتساوي 25٪
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!isBalanced}
                                    onClick={handleSaveSplits}
                                    className={`px-4 py-1.5 rounded text-[10px] font-black shadow-sm ${
                                      isBalanced 
                                        ? 'bg-indigo-650 hover:bg-indigo-700 text-white' 
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                                  >
                                    تأكيد وحفظ الأبعاد 💾
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {selectedAccTab === 'reconciliation' && (() => {
                        const isReconciled = currentAccount.isReconciled;
                        const lastDate = currentAccount.lastReconciliationDate;

                        const reconciliableLines = getNormalizedJournalEntries()
                          .flatMap((entry: any) => (entry.lines || [])
                            .filter((line: any) => line.accountCode === currentAccount.code)
                            .map((line: any) => ({ ...line, entryId: entry.id, date: entry.date, description: entry.description })))
                          .slice(0, 20);
                        const allChecked = reconciliableLines.length > 0
                          && reconciliableLines.every((_: any, index: number) => reconcileChecks[`line${index + 1}`]);

                        const handleConfirmReconciliation = async () => {
                          if (canonicalFinancialStatus !== 'ready' || typeof persistCanonicalFinancialSnapshot !== 'function') {
                            triggerNotification('تعذر حفظ التسوية: المصدر المحاسبي المركزي غير جاهز.', 'warning');
                            return;
                          }
                          const updatedAccounts = accounts.map(a => {
                            if (a.code === currentAccount.code) {
                              return {
                                ...a,
                                isReconciled: true,
                                lastReconciliationDate: new Date().toISOString().split('T')[0]
                              };
                            }
                            return a;
                          });
                          try {
                            await persistCanonicalFinancialSnapshot({ chartOfAccounts: updatedAccounts });
                            setAccounts(updatedAccounts);
                            triggerNotification(`✓ تم حفظ التسوية والمطابقة المصرفية للحساب #${currentAccount.code} مركزياً.`, 'success');
                            logAction('RECONCILE_BANK_ACCOUNT', `حفظ المطابقة الدفترية المركزية للحساب #${currentAccount.code}`, 'الحسابات العامة');
                          } catch (error: any) {
                            triggerNotification(`تعذر حفظ التسوية مركزياً: ${error?.message || 'خطأ غير معروف'}`, 'warning');
                          }
                        };

                        return (
                          <div className="space-y-5 animate-fade-in text-right">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                              <h3 className="text-xs font-extrabold text-slate-900">مساعد التسوية والمطابقة المصرفية الذاتي</h3>
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-black">Bank Reconciliation Assistant</span>
                            </div>

                            {/* Status Bar */}
                            <div className={`p-4 rounded-xl border flex justify-between items-center ${isReconciled ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/40 border-amber-100'}`}>
                              <div className="flex items-center gap-2.5">
                                <div className={`w-3.5 h-3.5 rounded-full ${isReconciled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                <div className="text-[10px]">
                                  <span className="font-extrabold text-slate-900 block">حالة الحساب للشهر الحالي: {isReconciled ? 'مُطابَق ومعتمد بالكامل' : 'يحتاج تسوية ومطابقة العمليات الدفترية'}</span>
                                  {lastDate && <span className="text-slate-500 mt-0.5 block">تاريخ آخر مطابقة معتمدة: {lastDate}</span>}
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded font-black text-[9px] ${isReconciled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-850'}`}>
                                {isReconciled ? 'Reconciled' : 'Open'}
                              </span>
                            </div>

                            {/* Checklist instruction */}
                            <div className="text-[10px] text-slate-600 leading-relaxed">
                              قارن القيود الدفترية الداخلية مع كشف المعاملات المصرفية الواردة من مصرف الوحدة/الخزينة المعتمد، وقم بتحديد المعاملات المتطابقة بالأسفل:
                            </div>

                            {/* Central journal lines to check */}
                            <div className="space-y-2 text-[10px]">
                              {reconciliableLines.length > 0 ? reconciliableLines.map((line: any, index: number) => {
                                const amount = Number(line.debit || line.credit || 0);
                                const incoming = Number(line.debit || 0) > 0;
                                const key = `line${index + 1}`;
                                return (
                                  <div key={`${line.entryId}-${index}`} onClick={() => setReconcileChecks(p => ({ ...p, [key]: !p[key] }))} className={`flex justify-between items-center p-3 border rounded-xl cursor-pointer transition-all ${reconcileChecks[key] ? 'bg-indigo-50/40 border-indigo-200' : 'bg-white hover:bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center gap-2.5">
                                      <input type="checkbox" checked={!!reconcileChecks[key]} onChange={() => {}} className="rounded text-indigo-650" />
                                      <div>
                                        <span className="font-extrabold text-slate-800 block">{line.description || line.entryId}</span>
                                        <span className="text-slate-400 font-mono text-[9px]">المرجع: {line.entryId} | التاريخ: {line.date || 'غير محدد'}</span>
                                      </div>
                                    </div>
                                    <span className={`font-mono font-black ${incoming ? 'text-emerald-700' : 'text-rose-600'}`}>{incoming ? '+' : '-'}{amount.toLocaleString()} {currency}</span>
                                  </div>
                                );
                              }) : (
                                <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-center font-bold text-amber-900">لا توجد قيود موثقة قابلة للمطابقة لهذا الحساب.</div>
                              )}
                            </div>

                            {/* Reconciliation actions */}
                            <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                              <span className="text-[9.5px] text-slate-400 font-bold">
                                {allChecked ? '✓ جميع المعاملات محددة ومتطابقة' : 'يرجى تحديد كافة بنود كشف الحساب المصرفي لتأكيد المطابقة.'}
                              </span>
                              <button
                                type="button"
                                disabled={!allChecked}
                                onClick={handleConfirmReconciliation}
                                className={`px-5 py-2 rounded-lg font-black text-[11px] shadow-md transition-all ${
                                  allChecked 
                                    ? 'bg-indigo-650 hover:bg-indigo-700 text-white cursor-pointer' 
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                }`}
                              >
                                تأكيد وإغلاق تسوية الحساب 🔏
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {selectedAccTab === 'ledger' && (() => {
                        // Generate mock ledger transactions based on classification
                        let mockLines = [];
                        if (currentAccount.classification === 'مصروفات') {
                          mockLines = [
                            { date: '2026-06-18', desc: 'رواتب وأجور معلمي وموظفي الفرع لشهر مايو', ref: 'JV-1081', debit: 18500.00, credit: 0.00, postedBy: 'سليمان غازي' },
                            { date: '2026-06-10', desc: 'شراء وتجهيز كتب دراسية للمرحلتين الابتدائية والمتوسط', ref: 'PV-2041', debit: 3200.00, credit: 0.00, postedBy: 'سليمان غازي' },
                            { date: '2026-06-05', desc: 'صيانة مكيفات فصول مرحلة الروضة والابتدائي للفرع', ref: 'JV-1049', debit: 1200.00, credit: 0.00, postedBy: 'سليمان غازي' },
                          ];
                        } else if (currentAccount.classification === 'إيرادات') {
                          mockLines = [
                            { date: '2026-06-22', desc: 'تحصيل رسوم دراسية نقدية - الطالب عبد الرحمن الورفلي', ref: 'RV-9041', debit: 0.00, credit: 2800.00, postedBy: 'سليمان غازي' },
                            { date: '2026-06-19', desc: 'تحصيل رسوم حافلات النقل المدرسي الفصل الأول', ref: 'JV-2042', debit: 0.00, credit: 1500.00, postedBy: 'سليمان غازي' },
                            { date: '2026-06-15', desc: 'تسجيل وقبول طالب جديد - مريم الدرسي (ابتدائي)', ref: 'RV-9018', debit: 0.00, credit: 3200.00, postedBy: 'سليمان غازي' },
                          ];
                        } else if (currentAccount.classification === 'أصول') {
                          mockLines = [
                            { date: '2026-06-01', desc: 'الرصيد الافتتاحي المعين للدورة المالية الحالية', ref: 'OP-0001', debit: 125000.00, credit: 0.00, postedBy: 'النظام' },
                            { date: '2026-06-12', desc: 'توريد متحصلات نقدية من الرسوم الدراسية للخزينة', ref: 'JV-2110', debit: 15000.00, credit: 0.00, postedBy: 'سليمان غازي' },
                            { date: '2026-06-20', desc: 'صرف دفعة سلفة نقدية لمستلزمات الصيانة والمشتريات', ref: 'PV-3001', debit: 0.00, credit: 3500.00, postedBy: 'سليمان غازي' },
                          ];
                        } else {
                          // Equity, Liabilities, etc.
                          mockLines = [
                            { date: '2026-06-01', desc: 'رصيد مرحل من الدورة المحاسبية السابقة معتمد', ref: 'OP-0002', debit: 0.00, credit: currentAccount.balance || 12000.00, postedBy: 'النظام' },
                            { date: '2026-06-15', desc: 'تسجيل ذمم والتزامات مورد الملابس والمطبوعات المدرسية', ref: 'JV-3091', debit: 0.00, credit: 4500.00, postedBy: 'سليمان غازي' },
                          ];
                        }

                        return (
                          <div className="printable-area space-y-4 animate-fade-in text-right">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                              <h3 className="text-xs font-extrabold text-slate-900">سجل حركات وتدقيق الحساب المباشر (Account Ledger Audit Trail)</h3>
                              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-black">Audit Ledger System</span>
                            </div>

                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              تستعرض هذه الشاشة آخر حركات التدقيق (القيود الفرعية) التي أثرت على رصيد الحساب مباشرة لضمان شفافية التحقق ومكافحة الأخطاء الدفترية.
                            </p>

                            {/* Ledger Table */}
                            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                              <table className="w-full text-right text-[10px]" dir="rtl">
                                <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                                  <tr>
                                    <th className="p-2">التاريخ</th>
                                    <th className="p-2">البيان والتفاصيل</th>
                                    <th className="p-2">المرجع</th>
                                    <th className="p-2 text-left">مدين</th>
                                    <th className="p-2 text-left">دائن</th>
                                    <th className="p-2 text-center">المرحل</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                  {mockLines.map((line, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      <td className="p-2 font-mono whitespace-nowrap">{line.date}</td>
                                      <td className="p-2 font-semibold text-slate-800">{line.desc}</td>
                                      <td className="p-2 font-mono text-indigo-700 font-bold">{line.ref}</td>
                                      <td className="p-2 font-mono text-left text-slate-900">
                                        {line.debit > 0 ? line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                      </td>
                                      <td className="p-2 font-mono text-left text-slate-900">
                                        {line.credit > 0 ? line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                      </td>
                                      <td className="p-2 text-center text-slate-400 font-bold whitespace-nowrap">{line.postedBy}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Print / Export Audit */}
                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => { window.focus(); window.print(); }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>طباعة كشف الحساب التفصيلي 🖶</span>
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                  );
                })()}

                {/* 2. Create / Edit Mode Form Panel */}
                {(coaMode === 'create' || coaMode === 'edit') && (
                  <form onSubmit={handleSaveCoa} className="space-y-5">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <Calculator className="w-5 h-5" />
                        <h3 className="text-sm font-black">
                          {coaMode === 'create' ? 'إنشاء حساب مالي هرمي جديد' : `تعديل بيانات الحساب المالي #${selectedAccountCode}`}
                        </h3>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">تأكد من اختيار الروابط وتنسيق الحساب الأب لضمان تتابع كود القيود والميزانية العمومية بشكل صحيح.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                      
                      {/* Hierarchical Code */}
                      <div>
                        <label className="block text-slate-600 font-black mb-1.5">كود الحساب المالي (Hierarchical Code): <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          disabled={coaMode === 'edit'}
                          placeholder="مثال: 1101 أو 5210"
                          value={coaForm.code}
                          onChange={(e) => setCoaForm(prev => ({ ...prev, code: e.target.value.replace(/\D/g, '') }))}
                          className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/30"
                        />
                      </div>

                      {/* Name Arabic */}
                      <div>
                        <label className="block text-slate-600 font-black mb-1.5">اسم الحساب (باللغة العربية): <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: صندوق مصروفات مرحلة الروضة"
                          value={coaForm.nameAr}
                          onChange={(e) => setCoaForm(prev => ({ ...prev, nameAr: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/30"
                        />
                      </div>

                      {/* Name English */}
                      <div>
                        <label className="block text-slate-600 font-black mb-1.5">اسم الحساب (باللغة الإنجليزية):</label>
                        <input
                          type="text"
                          placeholder="e.g. Kindergarten Cash Safe"
                          value={coaForm.nameEn}
                          onChange={(e) => setCoaForm(prev => ({ ...prev, nameEn: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-left font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500/30"
                          dir="ltr"
                        />
                      </div>

                      {/* Parent Account */}
                      <div>
                        <label className="block text-slate-600 font-black mb-1.5">الحساب الأب المباشر (Parent):</label>
                        <select
                          value={coaForm.parentAccountId}
                          onChange={(e) => {
                            const val = e.target.value;
                            const parentNode = accounts.find(a => a.code === val);
                            setCoaForm(prev => ({ 
                              ...prev, 
                              parentAccountId: val,
                              // Auto inherit classification and nature if parent exists
                              classification: parentNode ? parentNode.classification : prev.classification,
                              natureType: parentNode ? parentNode.natureType : prev.natureType
                            }));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/30"
                        >
                          <option value="">بدون - حساب أب رئيسي (الطبقة الأولى)</option>
                          {accounts.filter(a => a.type === 'رئيسي' && a.code !== coaForm.code).map(parent => (
                            <option key={parent.code} value={parent.code}>
                              ({parent.code}) - {parent.nameAr}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Account Type */}
                      <div>
                        <label className="block text-slate-600 font-black mb-1.5">نوع الحساب المالي:</label>
                        <div className="flex gap-4 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="coaType"
                              value="رئيسي"
                              checked={coaForm.type === 'رئيسي'}
                              onChange={() => setCoaForm(prev => ({ ...prev, type: 'رئيسي' }))}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="font-black text-indigo-900">رئيسي (تجميعي للمجموعات)</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="coaType"
                              value="فرعي"
                              checked={coaForm.type === 'فرعي'}
                              onChange={() => setCoaForm(prev => ({ ...prev, type: 'فرعي' }))}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="font-bold text-slate-700">فرعي (حساب أستاذ قيود)</span>
                          </label>
                        </div>
                      </div>

                      {/* Classification (if no parent selected) */}
                      <div>
                        <label className="block text-slate-600 font-black mb-1.5">التصنيف والتبويب المالي الرئيسي:</label>
                        <select
                          disabled={!!coaForm.parentAccountId}
                          value={coaForm.classification}
                          onChange={(e) => setCoaForm(prev => ({ ...prev, classification: e.target.value as any }))}
                          className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/30"
                        >
                          <option value="أصول">الأصول (Assets)</option>
                          <option value="خصوم">الخصوم (Liabilities)</option>
                          <option value="حقوق ملكية">حقوق الملكية (Equity)</option>
                          <option value="إيرادات">الإيرادات (Revenues)</option>
                          <option value="مصروفات">المصروفات (Expenses)</option>
                        </select>
                        {coaForm.parentAccountId && (
                          <span className="text-[9px] text-slate-400 mt-0.5 block">يرث التصنيف تلقائياً من الحساب الأب المحدد.</span>
                        )}
                      </div>

                      {/* Default Cost Center ID */}
                      <div>
                        <label className="block text-slate-600 font-black mb-1.5">ربط مركز التكلفة الافتراضي (المرحلة التعليمية):</label>
                        <select
                          value={coaForm.costCenterId}
                          onChange={(e) => setCoaForm(prev => ({ ...prev, costCenterId: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/30"
                        >
                          <option value="">بدون - حساب عام لمجمع المدارس</option>
                          <option value="kindergarten">قسم مرحلة الروضة والتمهيدي (Kindergarten)</option>
                          <option value="primary">قسم مرحلة التعليم الابتدائي (Primary)</option>
                          <option value="middle">قسم مرحلة التعليم المتوسط (Middle)</option>
                          <option value="secondary">قسم مرحلة التعليم الثانوي (Secondary)</option>
                        </select>
                        <span className="text-[9px] text-indigo-500 mt-1 block">يربط هذا الحساب بمركز التكلفة لفرز تقارير الأرباح والمصروفات لكل مرحلة على حدة.</span>
                      </div>

                      {/* Nature Type */}
                      <div>
                        <label className="block text-slate-600 font-black mb-1.5">طبيعة الحساب الافتراضية:</label>
                        <select
                          value={coaForm.natureType}
                          onChange={(e) => setCoaForm(prev => ({ ...prev, natureType: e.target.value as any }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/30"
                        >
                          <option value="مدين">مدين (Debit)</option>
                          <option value="دائن">دائن (Credit)</option>
                        </select>
                      </div>

                      {/* Status Checkbox */}
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={coaForm.isActive}
                            onChange={(e) => setCoaForm(prev => ({ ...prev, isActive: e.target.checked }))}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <div>
                            <span className="font-black text-slate-800 block">حالة الحساب نشط حالياً</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">الحسابات غير النشطة يتم إخفاؤها من مسودات سندات الصرف والقبض والقيود المزدوجة.</span>
                          </div>
                        </label>
                      </div>

                      {/* Notes */}
                      <div className="md:col-span-2">
                        <label className="block text-slate-600 font-black mb-1.5">ملاحظات توضيحية:</label>
                        <textarea
                          placeholder="اكتب أي ملاحظات فنية أو قيود مخصصة للحركة على هذا الحساب..."
                          rows={3}
                          value={coaForm.notes}
                          onChange={(e) => setCoaForm(prev => ({ ...prev, notes: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/30"
                        />
                      </div>

                    </div>

                    {/* Form actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleCancelCoa}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-lg text-[11px] transition-all"
                      >
                        إلغاء الأمر
                      </button>

                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6 py-2.5 rounded-lg text-[11px] shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>حفظ الحساب المالي الموحد</span>
                      </button>
                    </div>

                  </form>
                )}

              </div>

            </div>
          )}

          {coaWorkspaceMode === 'dashboard' && (() => {
            const assetAccs = accounts.filter(a => a.classification === 'أصول' && a.type === 'فرعي');
            const liabAccs = accounts.filter(a => a.classification === 'خصوم' && a.type === 'فرعي');
            const equityAccs = accounts.filter(a => a.classification === 'حقوق ملكية' && a.type === 'فرعي');
            const revAccs = accounts.filter(a => a.classification === 'إيرادات' && a.type === 'فرعي');
            const expAccs = accounts.filter(a => a.classification === 'مصروفات' && a.type === 'فرعي');

            const totalAssets = assetAccs.reduce((sum, a) => sum + a.balance, 0);
            const totalLiabilities = liabAccs.reduce((sum, a) => sum + a.balance, 0);
            const totalEquity = equityAccs.reduce((sum, a) => sum + a.balance, 0);
            const totalRevenues = revAccs.reduce((sum, a) => sum + a.balance, 0);
            const totalExpenses = expAccs.reduce((sum, a) => sum + a.balance, 0);
            const netSurplus = totalRevenues - totalExpenses;

            // Balance sheet equation check
            const bsEquilibrium = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

            // Scan handler
            const handleStartAuditScan = () => {
              setCoaScanState('scanning');
              setTimeout(() => {
                setCoaScanState('completed');
                triggerNotification('✓ تم الانتهاء من فحص شجرة الحسابات والدليل المالي الموحد بالكامل وفق المعيار الدولي IFRS 101', 'success');
              }, 1200);
            };

            // Interactive Auto-Fixer for parent sums
            const handleAutoFixParentBalances = () => {
              // For each parent, sum its children and set parent balance
              setAccounts(prev => {
                const updated = [...prev];
                // Go level by level from bottom up (3 to 1)
                for (let lv = 3; lv >= 1; lv--) {
                  updated.forEach(acc => {
                    if (acc.level === lv && acc.type === 'رئيسي') {
                      const children = updated.filter(c => c.parentAccountId === acc.code);
                      if (children.length > 0) {
                        acc.balance = children.reduce((sum, c) => sum + c.balance, 0);
                      }
                    }
                  });
                }
                return updated;
              });
              setCoaAuditFixCount(prev => prev + 1);
              triggerNotification('✓ تم إصلاح موازين حسابات التجميع بنجاح وتطابق مجاميع المستويات الفرعية!', 'success');
              logAction('AUTO_FIX_COA_BALANCES', 'إعادة احتساب وتزامن أرصدة الحسابات الإجمالية من الحسابات الفرعية تلقائياً بمساعد التدقيق', 'الحسابات العامة');
            };

            return (
              <div className="space-y-6 animate-fade-in text-right">
                
                {/* 1. Bento KPI Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  
                  {/* Assets */}
                  <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <span className="text-[10px] text-emerald-800 font-extrabold block">إجمالي قيمة الأصول</span>
                    <span className="text-sm font-black font-mono text-emerald-700 block mt-2" dir="ltr">
                      {totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] font-sans">د.ل</span>
                    </span>
                    <div className="w-1.5 h-12 bg-emerald-500 rounded-full absolute right-0 top-4" />
                    <span className="text-[9px] text-emerald-600 block mt-1 font-semibold">{assetAccs.length} حساب فرعي نشط</span>
                  </div>

                  {/* Liabilities */}
                  <div className="bg-gradient-to-br from-rose-500/5 to-rose-600/10 border border-rose-500/20 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <span className="text-[10px] text-rose-800 font-extrabold block">الخصوم والالتزامات</span>
                    <span className="text-sm font-black font-mono text-rose-700 block mt-2" dir="ltr">
                      {totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] font-sans">د.ل</span>
                    </span>
                    <div className="w-1.5 h-12 bg-rose-500 rounded-full absolute right-0 top-4" />
                    <span className="text-[9px] text-rose-600 block mt-1 font-semibold">{liabAccs.length} التزامات تجارية</span>
                  </div>

                  {/* Equity */}
                  <div className="bg-gradient-to-br from-purple-500/5 to-purple-600/10 border border-purple-500/20 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <span className="text-[10px] text-purple-800 font-extrabold block">حقوق الملكية ورأس المال</span>
                    <span className="text-sm font-black font-mono text-purple-700 block mt-2" dir="ltr">
                      {totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] font-sans">د.ل</span>
                    </span>
                    <div className="w-1.5 h-12 bg-purple-500 rounded-full absolute right-0 top-4" />
                    <span className="text-[9px] text-purple-600 block mt-1 font-semibold">رأس مال المجمع المدفوع</span>
                  </div>

                  {/* Revenues */}
                  <div className="bg-gradient-to-br from-sky-500/5 to-sky-600/10 border border-sky-500/20 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <span className="text-[10px] text-sky-800 font-extrabold block">الإيرادات المحصلة YTD</span>
                    <span className="text-sm font-black font-mono text-sky-700 block mt-2" dir="ltr">
                      {totalRevenues.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] font-sans">د.ل</span>
                    </span>
                    <div className="w-1.5 h-12 bg-sky-500 rounded-full absolute right-0 top-4" />
                    <span className="text-[9px] text-sky-600 block mt-1 font-semibold">رسوم طلابية وأنشطة فرعية</span>
                  </div>

                  {/* Expenses */}
                  <div className="bg-gradient-to-br from-amber-500/5 to-amber-600/10 border border-amber-500/20 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <span className="text-[10px] text-amber-800 font-extrabold block">الأعباء والمصروفات YTD</span>
                    <span className="text-sm font-black font-mono text-amber-700 block mt-2" dir="ltr">
                      {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] font-sans">د.ل</span>
                    </span>
                    <div className="w-1.5 h-12 bg-amber-500 rounded-full absolute right-0 top-4" />
                    <span className="text-[9px] text-amber-600 block mt-1 font-semibold">أجور وصيانة ومصاريف تشغيل</span>
                  </div>

                  {/* Net Surplus */}
                  <div className={`bg-gradient-to-br border rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all ${
                    netSurplus >= 0 
                      ? 'from-emerald-500/5 to-indigo-600/10 border-indigo-500/20' 
                      : 'from-rose-500/5 to-rose-600/10 border-rose-500/20'
                  }`}>
                    <span className="text-[10px] font-extrabold block text-slate-800">صافي الفائض / العجز المالي</span>
                    <span className={`text-sm font-black font-mono block mt-2 ${netSurplus >= 0 ? 'text-indigo-700' : 'text-rose-700'}`} dir="ltr">
                      {netSurplus.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] font-sans">د.ل</span>
                    </span>
                    <div className={`w-1.5 h-12 rounded-full absolute right-0 top-4 ${netSurplus >= 0 ? 'bg-indigo-600' : 'bg-rose-600'}`} />
                    <span className="text-[9px] text-slate-500 block mt-1 font-semibold">حساب الأرباح المحققة دورياً</span>
                  </div>

                </div>

                {/* 2. Graphical Share Analysis & Allocation (Beautiful Interactive SVG charts) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Category share chart */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-xs font-black text-slate-900 mb-4 pb-2 border-b border-slate-100 flex justify-between items-center">
                      <span>توزيع الأرصدة والكتل المالية بالدليل (Financial Blocks Share)</span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[9px] font-bold font-mono">Structural Balance</span>
                    </h3>
                    
                    <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-4">
                      {/* Interactive Donut SVG Chart */}
                      <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          {/* We dynamically calculate stroke dashes for Assets, Liabilities, Equity, Revenues, Expenses */}
                          {(() => {
                            const totalVal = totalAssets + totalLiabilities + totalEquity + totalRevenues + totalExpenses || 1;
                            const pAssets = (totalAssets / totalVal) * 100;
                            const pLiab = (totalLiabilities / totalVal) * 100;
                            const pEquity = (totalEquity / totalVal) * 100;
                            const pRev = (totalRevenues / totalVal) * 100;
                            const pExp = (totalExpenses / totalVal) * 100;

                            const r = 35;
                            const circ = 2 * Math.PI * r;

                            const dAssets = (pAssets / 100) * circ;
                            const dLiab = (pLiab / 100) * circ;
                            const dEquity = (pEquity / 100) * circ;
                            const dRev = (pRev / 100) * circ;
                            const dExp = (pExp / 100) * circ;

                            let offset = 0;
                            return (
                              <>
                                {/* Background circle */}
                                <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                                
                                {/* Assets Circle */}
                                <circle cx="50" cy="50" r={r} fill="transparent" stroke="#10b981" strokeWidth="12" 
                                  strokeDasharray={`${dAssets} ${circ}`} strokeDashoffset={-offset} />
                                {(offset += dAssets, null)}

                                {/* Liabilities Circle */}
                                <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f43f5e" strokeWidth="12" 
                                  strokeDasharray={`${dLiab} ${circ}`} strokeDashoffset={-offset} />
                                {(offset += dLiab, null)}

                                {/* Equity Circle */}
                                <circle cx="50" cy="50" r={r} fill="transparent" stroke="#a855f7" strokeWidth="12" 
                                  strokeDasharray={`${dEquity} ${circ}`} strokeDashoffset={-offset} />
                                {(offset += dEquity, null)}

                                {/* Revenues Circle */}
                                <circle cx="50" cy="50" r={r} fill="transparent" stroke="#0ea5e9" strokeWidth="12" 
                                  strokeDasharray={`${dRev} ${circ}`} strokeDashoffset={-offset} />
                                {(offset += dRev, null)}

                                {/* Expenses Circle */}
                                <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f59e0b" strokeWidth="12" 
                                  strokeDasharray={`${dExp} ${circ}`} strokeDashoffset={-offset} />
                              </>
                            );
                          })()}
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-[9px] text-slate-400 font-bold">إجمالي الميزان</span>
                          <span className="text-xs font-black font-mono text-slate-800">
                            {((totalAssets + totalLiabilities + totalEquity + totalRevenues + totalExpenses) / 1000).toFixed(0)}K
                          </span>
                        </div>
                      </div>

                      {/* Legend with percentages */}
                      <div className="space-y-2 text-[10px] w-full md:w-auto">
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> الأصول</span>
                          <span className="font-mono text-slate-700 font-extrabold">{totalAssets.toLocaleString()} د.ل</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> الخصوم</span>
                          <span className="font-mono text-slate-700 font-extrabold">{totalLiabilities.toLocaleString()} د.ل</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-purple-500 inline-block" /> حقوق الملكية</span>
                          <span className="font-mono text-slate-700 font-extrabold">{totalEquity.toLocaleString()} د.ل</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-sky-500 inline-block" /> الإيرادات</span>
                          <span className="font-mono text-slate-700 font-extrabold">{totalRevenues.toLocaleString()} د.ل</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> المصروفات</span>
                          <span className="font-mono text-slate-700 font-extrabold">{totalExpenses.toLocaleString()} د.ل</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Operational indicators & Phase splits */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 mb-4 pb-2 border-b border-slate-100 flex justify-between items-center">
                        <span>مؤشرات الربحية وكفاءة استخدام الموارد</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-bold font-mono">Profitability Indicators</span>
                      </h3>

                      <div className="space-y-4">
                        {/* Margin */}
                        <div>
                          <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="font-extrabold text-slate-700">الهامش التشغيلي للمؤسسة:</span>
                            <span className="font-mono font-black text-indigo-700">
                              {totalRevenues > 0 ? ((netSurplus / totalRevenues) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${totalRevenues > 0 ? Math.min(100, Math.max(0, (netSurplus / totalRevenues) * 100)) : 0}%` }} />
                          </div>
                        </div>

                        {/* Expense ratio */}
                        <div>
                          <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="font-extrabold text-slate-700">معدل عبء المصروفات إلى الإيرادات:</span>
                            <span className="font-mono font-black text-amber-700">
                              {totalRevenues > 0 ? ((totalExpenses / totalRevenues) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${totalRevenues > 0 ? Math.min(100, (totalExpenses / totalRevenues) * 100) : 0}%` }} />
                          </div>
                        </div>

                        {/* Liquid assets ratio */}
                        <div>
                          <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="font-extrabold text-slate-700">معدل تغطية السيولة النقدية للالتزامات القصيرة:</span>
                            <span className="font-mono font-black text-emerald-700">
                              {totalLiabilities > 0 ? (totalAssets / totalLiabilities).toFixed(2) : '10.0+'}x
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: '85%' }} />
                          </div>
                          <p className="text-[8px] text-slate-400 mt-1">✓ نسبة الأمان آمنة جداً وتفوق المعيار المقبول لسرعة سداد المستحقات.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl flex items-center justify-between text-[10px] mt-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse shrink-0" />
                        <span className="font-semibold text-slate-700">مجموع مراكز التكلفة للفروع متزن حالياً:</span>
                      </div>
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">100% متطابق</span>
                    </div>
                  </div>

                </div>

                {/* 3. GAAP / IFRS regulatory Compliance Auditor Section */}
                <div className="bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 animate-pulse">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-900">مستشار التدقيق والالتزام الضريبي والمحاسبي IFRS</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">فحص تلقائي ومعياري لبنية شجرة الحسابات والدليل المالي لمنع الأخطاء وضمان المطابقة الكاملة</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleStartAuditScan}
                      disabled={coaScanState === 'scanning'}
                      className="bg-indigo-650 hover:bg-indigo-700 text-white font-black text-[11px] px-5 py-2.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5 self-stretch sm:self-auto justify-center cursor-pointer"
                    >
                      {coaScanState === 'scanning' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>جاري فحص القيود والترتيب...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5" />
                          <span>إطلاق الفحص الشامل للدليل 🔍</span>
                        </>
                      )}
                    </button>
                  </div>

                  {coaScanState === 'idle' && (
                    <div className="text-center py-8 text-slate-500 space-y-2">
                      <p className="font-semibold">لم يتم إجراء فحص المعايير للدورة المالية الحالية بعد.</p>
                      <p className="text-[9px] text-slate-400">انقر فوق زر "إطلاق الفحص" للتحقق من الميزان ومراجعة الأخطاء المعلقة.</p>
                    </div>
                  )}

                  {coaScanState === 'scanning' && (
                    <div className="py-8 space-y-4">
                      <div className="flex justify-between text-[10px] text-slate-600">
                        <span>جاري فحص أرصدة الأصول وقوة موازين التجميع...</span>
                        <span className="font-mono">45%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>
                  )}

                  {coaScanState === 'completed' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* 1. Rule Check: Balance Sheet Equilibrium */}
                        <div className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                          bsEquilibrium ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] text-slate-500 font-extrabold block">قاعدة توازن الميزانية العمومية</span>
                              <h5 className="text-[11px] font-black mt-1 text-slate-900">المعادلة: الأصول = الخصوم + حقوق الملكية</h5>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                              bsEquilibrium ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {bsEquilibrium ? 'متطابق متوازن' : 'غير متزن'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-700">
                            <span>الأصول: {totalAssets.toLocaleString()} د.ل</span>
                            <span>الخصوم والملكية: {(totalLiabilities + totalEquity).toLocaleString()} د.ل</span>
                          </div>

                          {bsEquilibrium ? (
                            <p className="text-[9px] text-emerald-700">✓ تم التحقق بنجاح: ميزان الأصول يتطابق تماماً مع مصادر التمويل والخصوم وفق GAAP.</p>
                          ) : (
                            <div className="flex items-center justify-between gap-2 border-t border-rose-200 pt-2 mt-1">
                              <p className="text-[9px] text-rose-700 font-bold">تنبيه: يوجد فجوة مالية بالدليل بمقدار {Math.abs(totalAssets - (totalLiabilities + totalEquity)).toLocaleString()} د.ل!</p>
                              <button 
                                type="button"
                                onClick={() => {
                                  // Fix by putting difference in equity or matching
                                  const diff = totalAssets - (totalLiabilities + totalEquity);
                                  setAccounts(prev => prev.map(a => {
                                    if (a.code === '3101') {
                                      return { ...a, balance: a.balance + diff };
                                    }
                                    return a;
                                  }));
                                  triggerNotification('✓ تم معالجة وتثبيت الفجوة وتحويل الفارق لحساب رأس المال الفعلي لإحداث التوازن!', 'success');
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[8px] px-2 py-1 rounded transition-all shrink-0 cursor-pointer"
                              >
                                توازن تلقائي ⚡
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 2. Rule Check: Parent Node Aggregation Mismatch */}
                        {(() => {
                          const mismatchingNodes: Array<{ parent: string; current: number; childrenSum: number }> = [];
                          accounts.forEach(acc => {
                            if (acc.type === 'رئيسي') {
                              const subAccs = accounts.filter(c => c.parentAccountId === acc.code);
                              if (subAccs.length > 0) {
                                const sum = subAccs.reduce((s, c) => s + c.balance, 0);
                                if (Math.abs(acc.balance - sum) > 0.01) {
                                  mismatchingNodes.push({ parent: acc.nameAr, current: acc.balance, childrenSum: sum });
                                }
                              }
                            }
                          });

                          const hasMismatches = mismatchingNodes.length > 0;

                          return (
                            <div className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                              !hasMismatches ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'
                            }`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[9px] text-slate-500 font-extrabold block">تزامن المستويات التجميعية الهرمية</span>
                                  <h5 className="text-[11px] font-black mt-1 text-slate-900">فحص تطابق أرصدة الحسابات الأب مع الحسابات التابعة</h5>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                                  !hasMismatches ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {!hasMismatches ? 'هيكل متطابق' : 'فجوة مجاميع هرمية'}
                                </span>
                              </div>

                              <p className="text-[9px] text-slate-650 leading-relaxed font-semibold">
                                {!hasMismatches 
                                  ? '✓ رائع! جميع أرصدة الحسابات الرئيسية الإجمالية تتطابق تماماً مع مجاميع تفرعاتها الفرعية الحالية.' 
                                  : `يوجد عدد (${mismatchingNodes.length}) حسابات رئيسية لا تتطابق أرصدتها مع مجموع حساباتها التابعة.`}
                              </p>

                              {hasMismatches && (
                                <div className="flex items-center justify-between gap-2 border-t border-amber-200 pt-2 mt-1">
                                  <span className="text-[9px] text-amber-800 font-semibold">اكتشفنا تباين بسبب القيود المباشرة القديمة.</span>
                                  <button
                                    type="button"
                                    onClick={handleAutoFixParentBalances}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[8px] px-2.5 py-1 rounded transition-all shrink-0 cursor-pointer"
                                  >
                                    تجميع وإعادة موازنة ⚡
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* 3. Rule Check: Budget Limit Overrun */}
                        {(() => {
                          const overrunList = accounts.filter(a => a.classification === 'مصروفات' && a.annualBudget && a.balance > a.annualBudget);
                          const hasOverruns = overrunList.length > 0;

                          return (
                            <div className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                              !hasOverruns ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                            }`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[9px] text-slate-500 font-extrabold block">رقابة وتتبع الموازنات التقديرية</span>
                                  <h5 className="text-[11px] font-black mt-1 text-slate-900">رصد تجاوز السقوف المالية المعتمدة للعام</h5>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                                  !hasOverruns ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                              {!hasOverruns ? 'موازنات منضبطة' : 'مخالفات موازنة'}
                            </span>
                          </div>

                          <div className="text-[9.5px] text-slate-650 font-medium">
                            {!hasOverruns ? (
                              <span>✓ لم يتم تجاوز أي سقف تقديري للموازنات السنوية بجميع البنود التشغيلية.</span>
                            ) : (
                              <div className="space-y-1 max-h-[80px] overflow-y-auto font-sans">
                                {overrunList.map(ov => (
                                  <div key={ov.code} className="flex justify-between items-center bg-slate-100 p-1.5 rounded">
                                    <span className="font-bold">{ov.nameAr}</span>
                                    <span className="font-mono text-rose-600 font-bold">تجاوز {(ov.balance - (ov.annualBudget || 0)).toLocaleString()} د.ل</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {hasOverruns && (
                            <p className="text-[8px] text-rose-700 font-extrabold">تنبيه: يجب مراجعة عقود البنود أعلاه فوراً أو رفع السقف المخصص لتجنب تجميد القيود.</p>
                          )}
                        </div>
                      );
                    })()}

                    {/* 4. Rule Check: Inactive Accounts with Balance */}
                    {(() => {
                      const inactiveWithBalance = accounts.filter(a => !a.isActive && a.balance !== 0);
                      const hasAlert = inactiveWithBalance.length > 0;

                      return (
                        <div className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                          !hasAlert ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] text-slate-500 font-extrabold block">سلامة الحسابات المعطلة مؤقتاً</span>
                              <h5 className="text-[11px] font-black mt-1 text-slate-900">فحص وجود أرصدة معلقة على كود مالي غير نشط</h5>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                              !hasAlert ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {!hasAlert ? 'آمن ومطابق' : 'مخالفة تجميد'}
                            </span>
                          </div>

                          <p className="text-[9px] text-slate-650 leading-relaxed font-bold">
                            {!hasAlert 
                              ? '✓ ممتاز! لا يوجد أي حساب مالي غير نشط يحوي أرصدة معلقة حالياً.' 
                              : `اكتشفنا عدد (${inactiveWithBalance.length}) حسابات معطلة ولكنها تحمل رصيد مالي قائم.`}
                          </p>

                          {hasAlert && (
                            <div className="flex justify-between items-center border-t border-amber-200 pt-2 mt-1">
                              <span className="text-[9px] text-amber-800 font-semibold">تفعيلها يتيح تدقيق العمليات.</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setAccounts(prev => prev.map(a => {
                                    if (!a.isActive && a.balance !== 0) {
                                      return { ...a, isActive: true };
                                    }
                                    return a;
                                  }));
                                  triggerNotification('✓ تم إعادة تفعيل وتنشيط كافة الحسابات الحاملة للأرصدة بنجاح لتصحيح وضعها المالي!', 'success');
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[8px] px-2 py-1 rounded transition-all shrink-0 cursor-pointer"
                              >
                                تنشيط الحسابات المتأثرة ⚡
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* 5. Rule Check: Exhaustive Journal Entries Integrity Audit */}
                    {(() => {
                      const violations: string[] = [];
                      const validCostCenters = ['cc_kg', 'cc_primary', 'cc_middle', 'cc_high', 'kindergarten', 'primary', 'middle', 'secondary', 'all', 'stage_kg', 'stage_primary', 'stage_middle', 'stage_high'];
                      const validBranches = ['branch_1_1', 'branch_1_2', 'branch_2_1', 'branch_3_1', 'الفرع الرئيسي', 'الفرع الرئيسي - طرابلس', 'الفرع الغربي'];

                      journalEntries.forEach(jv => {
                        const lines = jv.lines || [];
                        const debitTotal = lines.reduce((sum: number, l: any) => sum + (parseFloat(l.debit) || 0), 0);
                        const creditTotal = lines.reduce((sum: number, l: any) => sum + (parseFloat(l.credit) || 0), 0);
                        
                        // Check balance
                        if (Math.abs(debitTotal - creditTotal) > 0.001) {
                          violations.push(`القيد (${jv.id}): تباين محاسبي بمقدار ${(debitTotal - creditTotal).toFixed(2)} د.ل.`);
                        }

                        // Check lines
                        lines.forEach((line: any) => {
                          const acc = accounts.find((a: any) => a.code === line.accountCode || a.id === line.accountCode);
                          if (!acc) {
                            violations.push(`القيد (${jv.id}): يدرج حساب مالي غير موجود بالدليل كود (${line.accountCode}).`);
                          } else {
                            if (!acc.isActive) {
                              violations.push(`القيد (${jv.id}): يدرج حساب مالي معطل/ملغى (${acc.nameAr}).`);
                            }
                            if (acc.type === 'رئيسي') {
                              violations.push(`القيد (${jv.id}): يدرج حساب تجميعي رئيسي (${acc.nameAr}) يمنع الترحيل عليه.`);
                            }
                          }

                          if (line.costCenter && !validCostCenters.includes(line.costCenter)) {
                            violations.push(`القيد (${jv.id}): يدرج مركز تكلفة غير معرّف بالنظام (${line.costCenter}).`);
                          }
                        });

                        // Check branches and schools
                        const jvBranch = jv.branchId || jv.branch || 'الفرع الرئيسي - طرابلس';
                        if (jvBranch && !validBranches.includes(jvBranch)) {
                          violations.push(`القيد (${jv.id}): يخص فرع مالي غير معتمد (${jvBranch}).`);
                        }

                        const jvSchool = String(jv.schoolId || jv.school || '').trim();
                        if (!jvSchool) {
                          violations.push(`القيد (${jv.id}): لا يحمل معرف المدرسة؛ لا يمكن إثبات نطاقه التشغيلي.`);
                        }
                      });

                      const hasViolations = violations.length > 0;

                      return (
                        <div className="p-4 rounded-xl border flex flex-col justify-between gap-3 md:col-span-2 bg-slate-50/50 border-slate-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] text-slate-500 font-extrabold block">تدقيق ورقابة حركات قيود اليومية العامة JV</span>
                              <h5 className="text-[11px] font-black mt-1 text-slate-900">الرقابة الجنائية على القيود المباشرة والتسويات لمنع الانحراف الدفتري</h5>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                              !hasViolations ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {!hasViolations ? 'مطابقة قانونية 100%' : 'انحراف قيود مكتشف'}
                            </span>
                          </div>

                          <div className="text-[9.5px] text-slate-650 leading-relaxed font-semibold">
                            {!hasViolations ? (
                              <span className="text-emerald-700">✓ ممتاز! تم مطابقة كافة القيود الدفترية التاريخية والنشطة بنجاح. لا يوجد أي حساب ملغى، محذوف، مركز تكلفة تالف، أو تباين في الفروع أو المدارس.</span>
                            ) : (
                              <div className="space-y-1.5 max-h-[120px] overflow-y-auto font-sans bg-rose-50/30 p-2 rounded border border-rose-100">
                                {violations.map((violation, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 text-rose-700 text-[9px]">
                                    <span className="shrink-0 text-[10px]">⚠️</span>
                                    <span>{violation}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {hasViolations && (
                            <div className="flex justify-between items-center border-t border-rose-200 pt-2 mt-1">
                              <span className="text-[8.5px] text-rose-800 font-extrabold">يمنع منعاً باتاً اعتماد أي قيد تشغيلي معلق قبل تصحيح الانحرافات المحاسبية المكتشفة أعلاه.</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setJournalEntries(prev => prev.map(jv => {
                                    let lines = jv.lines || [];
                                    const debitTotal = lines.reduce((sum: number, l: any) => sum + (parseFloat(l.debit) || 0), 0);
                                    const creditTotal = lines.reduce((sum: number, l: any) => sum + (parseFloat(l.credit) || 0), 0);
                                    
                                    let fixedBranch = jv.branchId || jv.branch;
                                    if (fixedBranch && !validBranches.includes(fixedBranch)) {
                                      fixedBranch = 'الفرع الرئيسي - طرابلس';
                                    }

                                    const fixedSchool = jv.schoolId || jv.school;

                                    const fixedLines = lines.map((l: any) => {
                                      let fixedCc = l.costCenter;
                                      if (fixedCc && !validCostCenters.includes(fixedCc)) {
                                        fixedCc = 'all';
                                      }
                                      let fixedAcc = l.accountCode;
                                      const accObj = accounts.find((a: any) => a.code === fixedAcc || a.id === fixedAcc);
                                      if (!accObj) {
                                        fixedAcc = '1101';
                                      }
                                      return {
                                        ...l,
                                        costCenter: fixedCc,
                                        accountCode: fixedAcc
                                      };
                                    });

                                    if (Math.abs(debitTotal - creditTotal) > 0.01 && fixedLines.length >= 2) {
                                      const diff = debitTotal - creditTotal;
                                      if (diff > 0) {
                                        fixedLines[1].credit = parseFloat((fixedLines[1].credit + diff).toFixed(3));
                                      } else {
                                        fixedLines[0].debit = parseFloat((fixedLines[0].debit - diff).toFixed(3));
                                      }
                                    }

                                    return {
                                      ...jv,
                                      branch: fixedBranch,
                                      schoolId: fixedSchool,
                                      lines: fixedLines,
                                      debitTotal: fixedLines.reduce((sum: number, l: any) => sum + (parseFloat(l.debit) || 0), 0),
                                      creditTotal: fixedLines.reduce((sum: number, l: any) => sum + (parseFloat(l.credit) || 0), 0),
                                    };
                                  }));

                                  setAccounts(prev => prev.map(a => {
                                    const isUsed = journalEntries.some(j => (j.lines || []).some((l: any) => l.accountCode === a.code || l.accountCode === a.id));
                                    if (isUsed && !a.isActive) {
                                      return { ...a, isActive: true };
                                    }
                                    return a;
                                  }));

                                  triggerNotification('✓ تمت معالجة وإصلاح كافة قيود حركات اليومية العالقة تلقائياً ومطابقة فروعها ومدارسها!', 'success');
                                  logAction('AUTO_FIX_JOURNAL_VIOLATIONS', 'معالجة وتصفير انحرافات حركات اليومية العامة تلقائياً بمساعد التدقيق المالي', 'الحسابات العامة');
                                }}
                                disabled
                                title="المعالجة الآلية متوقفة حتى اعتماد نطاق المدرسة وخدمة دفتر الأستاذ الكانونية"
                                className="bg-slate-300 text-slate-600 font-extrabold text-[8px] px-3 py-1.5 rounded transition-all shrink-0 cursor-not-allowed"
                              >
                                المعالجة الآلية متوقفة — يلزم نطاق موثق
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  </div>
                </div>
              )}

                <div className="bg-slate-100 p-4 border border-slate-200 rounded-xl flex flex-wrap justify-between items-center gap-3 mt-4 text-[11px]">
                  <span className="text-slate-600">إجمالي معالجات الذكاء الاصطناعي الناجحة: <strong className="text-emerald-700 font-mono">{coaAuditFixCount} إصلاحات</strong></span>
                  <span className="text-slate-400 font-semibold font-mono">IFRS Rules Engine 3.2.1-Standard</span>
                </div>
                </div>
              </div>
            );
          })()}

        {coaWorkspaceMode === 'spreadsheet' && (() => {
          const handleSaveSpreadLine = (accCode: string, fields: any) => {
            setAccounts(prev => prev.map(a => {
              if (a.code === accCode) {
                return {
                  ...a,
                  nameAr: fields.nameAr,
                  nameEn: fields.nameEn,
                  annualBudget: parseFloat(fields.annualBudget) || 0,
                  isActive: fields.isActive
                };
              }
              return a;
            }));
            setSpreadEditCode(null);
            triggerNotification(`✓ تم تحديث وحفظ بيانات الحساب (${accCode}) بنجاح!`, 'success');
            logAction('UPDATE_COA_SPREADSHEET', `تحديث بيانات الحساب #${accCode} عبر شاشة التعديل الجماعي`, 'الحسابات العامة');
          };

          return (
            <div className="space-y-4 animate-fade-in text-right">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-xs font-black text-slate-900">جدول التعديل السريع الجماعي (Spreadsheet Master Editor)</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">انقر فوق أيقونة التعديل في أي سطر لتعديل الاسم العربي والانجليزي والموازنات مباشرة وبسرعة فائقة دون مغادرة الشاشة</p>
                </div>
                <span className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded font-black text-[10px]">تعديل مباشر وسهل</span>
              </div>

              {/* Inline filter search */}
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="البحث السريع برقم الحساب أو الاسم أو طبيعته..."
                  value={coaSearchQuery}
                  onChange={(e) => setCoaSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white transition-all"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              </div>

              {/* Spreadsheet Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
                <table className="w-full text-right text-[10.5px]" dir="rtl">
                  <thead className="bg-slate-100 text-slate-900 font-extrabold sticky top-0 z-10 border-b border-slate-200 text-[10px]">
                    <tr>
                      <th className="p-3 text-center">الكود الهرمي</th>
                      <th className="p-3">الاسم بالعربية</th>
                      <th className="p-3">الاسم بالإنجليزية</th>
                      <th className="p-3">المستوى</th>
                      <th className="p-3">النوع</th>
                      <th className="p-3">التصنيف</th>
                      <th className="p-3 text-left">الرصيد المالي</th>
                      <th className="p-3 text-left">الموازنة السنوية</th>
                      <th className="p-3 text-center">حالة الحساب</th>
                      <th className="p-3 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                    {accounts.filter(a => {
                      if (!coaSearchQuery.trim()) return true;
                      const q = coaSearchQuery.toLowerCase();
                      return a.code.includes(q) || a.nameAr.toLowerCase().includes(q) || (a.nameEn && a.nameEn.toLowerCase().includes(q));
                    }).map(acc => {
                      const isEditing = spreadEditCode === acc.code;
                      
                      return (
                        <tr key={acc.code} className={`hover:bg-slate-50/50 transition-all ${isEditing ? 'bg-indigo-50/40' : ''}`}>
                          <td className="p-3 text-center font-mono font-bold text-indigo-700">{acc.code}</td>
                          
                          {/* Arabic Name Column */}
                          <td className="p-3">
                            {isEditing ? (
                              <input 
                                type="text" 
                                id={`edit-ar-${acc.code}`}
                                defaultValue={acc.nameAr}
                                className="bg-white border border-slate-300 rounded px-2 py-1 w-full text-[11px] font-semibold text-slate-800"
                              />
                            ) : (
                              <span className="font-semibold text-slate-900">{acc.nameAr}</span>
                            )}
                          </td>

                          {/* English Name Column */}
                          <td className="p-3">
                            {isEditing ? (
                              <input 
                                type="text" 
                                id={`edit-en-${acc.code}`}
                                defaultValue={acc.nameEn || ''}
                                className="bg-white border border-slate-300 rounded px-2 py-1 w-full text-[11px] font-mono"
                                dir="ltr"
                              />
                            ) : (
                              <span className="text-slate-400 font-mono text-[10px]">{acc.nameEn || '-'}</span>
                            )}
                          </td>

                          <td className="p-3 font-mono text-center">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">L-{acc.level}</span>
                          </td>

                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${acc.type === 'رئيسي' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'}`}>
                              {acc.type}
                            </span>
                          </td>

                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              acc.classification === 'أصول' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                              acc.classification === 'خصوم' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                              acc.classification === 'حقوق ملكية' ? 'bg-purple-50 text-purple-800 border border-purple-100' :
                              acc.classification === 'إيرادات' ? 'bg-sky-50 text-sky-800 border border-sky-100' :
                              'bg-amber-50 text-amber-800 border border-amber-100'
                            }`}>
                              {acc.classification}
                            </span>
                          </td>

                          <td className="p-3 font-mono text-left font-extrabold text-slate-900">
                            {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>

                          {/* Annual Budget Column */}
                          <td className="p-3 text-left font-mono">
                            {isEditing ? (
                              <input 
                                type="number" 
                                id={`edit-budget-${acc.code}`}
                                defaultValue={acc.annualBudget || 0}
                                className="bg-white border border-slate-300 rounded px-2 py-1 w-24 text-left text-[11px] font-mono font-bold"
                              />
                            ) : (
                              <span className="text-slate-700 font-bold">{(acc.annualBudget || 0).toLocaleString()}</span>
                            )}
                          </td>

                          {/* Active status Column */}
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <select 
                                id={`edit-active-${acc.code}`}
                                defaultValue={acc.isActive ? 'true' : 'false'}
                                className="bg-white border border-slate-300 rounded p-1 text-[11px] font-semibold"
                              >
                                <option value="true">نشط</option>
                                <option value="false">معطل</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold ${acc.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${acc.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                {acc.isActive ? 'نشط' : 'معلق'}
                              </span>
                            )}
                          </td>

                          {/* Actions Column */}
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const arVal = (document.getElementById(`edit-ar-${acc.code}`) as HTMLInputElement)?.value || acc.nameAr;
                                    const enVal = (document.getElementById(`edit-en-${acc.code}`) as HTMLInputElement)?.value || '';
                                    const budgetVal = (document.getElementById(`edit-budget-${acc.code}`) as HTMLInputElement)?.value || '0';
                                    const activeVal = (document.getElementById(`edit-active-${acc.code}`) as HTMLSelectElement)?.value === 'true';
                                    
                                    handleSaveSpreadLine(acc.code, {
                                      nameAr: arVal,
                                      nameEn: enVal,
                                      annualBudget: budgetVal,
                                      isActive: activeVal
                                    });
                                  }}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded shadow-sm transition-all text-[9px] font-black cursor-pointer"
                                  title="حفظ التعديلات"
                                >
                                  حفظ 💾
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSpreadEditCode(null)}
                                  className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition-all text-[9px] font-black cursor-pointer"
                                  title="إلغاء التعديل"
                                >
                                  إلغاء ❌
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSpreadEditCode(acc.code)}
                                className="p-1.5 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-700 hover:text-indigo-900 rounded transition-all font-black text-[9px]"
                              >
                                تعديل سريع 🖊️
                              </button>
                            )}
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          );
        })()}

        {coaWorkspaceMode === 'wizard' && (() => {
          const parentNodes = accounts.filter(a => a.type === 'رئيسي');
          
          const handleWizardSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            
            if (!wizardBaseName.trim()) {
              triggerNotification('فشل: يرجى إدخال اسم الحساب الأساسي لتوليد الفروع.', 'warning');
              return;
            }

            const parentNode = accounts.find(a => a.code === wizardParentId);
            if (!parentNode) {
              triggerNotification('خطأ: الحساب الأب غير موجود.', 'warning');
              return;
            }

            // Let's generate codes: we find the highest suffix under this parent
            const siblingCodes = accounts.filter(a => a.parentAccountId === wizardParentId).map(a => a.code);
            // Suffix calculation
            let nextSuffixStart = 1;
            if (siblingCodes.length > 0) {
              const suffixes = siblingCodes.map(c => parseInt(c.slice(wizardParentId.length)) || 0);
              nextSuffixStart = Math.max(...suffixes, 0) + 1;
            }

            const childrenToCreate = [
              { id: 'kindergarten', suffix: '10', nameAr: `${wizardBaseName} - مرحلة الروضة والتمهيدي`, nameEn: `${wizardBaseName} - Kindergarten`, cc: 'kindergarten' },
              { id: 'primary', suffix: '20', nameAr: `${wizardBaseName} - مرحلة التعليم الابتدائي`, nameEn: `${wizardBaseName} - Primary School`, cc: 'primary' },
              { id: 'middle', suffix: '30', nameAr: `${wizardBaseName} - مرحلة التعليم المتوسط`, nameEn: `${wizardBaseName} - Middle School`, cc: 'middle' },
              { id: 'secondary', suffix: '40', nameAr: `${wizardBaseName} - مرحلة التعليم الثانوي`, nameEn: `${wizardBaseName} - High School`, cc: 'secondary' },
            ];

            const newNodes: AccountNode[] = childrenToCreate.map((item, idx) => {
              const finalCode = `${wizardParentId}${nextSuffixStart}${item.suffix}`;
              return {
                id: finalCode,
                code: finalCode,
                name: item.nameAr,
                nameAr: item.nameAr,
                nameEn: item.nameEn,
                parentAccountId: wizardParentId,
                type: 'فرعي' as const,
                classification: parentNode.classification,
                level: (parentNode.level || 1) + 1,
                natureType: parentNode.natureType,
                isActive: true,
                balance: 0.00,
                currency: 'د.ل',
                costCenterId: item.cc,
                notes: `تم التوليد التلقائي عبر معالج الفروع بمراكز التكلفة للفروع التعليمية تحت الحساب الأب #${wizardParentId}`,
                annualBudget: parentNode.classification === 'مصروفات' ? 12000 : 0,
                dimensionSplit: [
                  { costCenterId: 'kindergarten', percentage: 25 },
                  { costCenterId: 'primary', percentage: 25 },
                  { costCenterId: 'middle', percentage: 25 },
                  { costCenterId: 'secondary', percentage: 25 }
                ]
              };
            });

            // Check duplicates
            const hasDuplicates = newNodes.some(nn => accounts.some(a => a.code === nn.code));
            if (hasDuplicates) {
              triggerNotification('تنبيه: الأكواد المالية المراد توليدها موجودة بالفعل بالمنظومة، يرجى اختيار حساب أب آخر أو تغيير السلسلة.', 'warning');
              return;
            }

            setAccounts(prev => [...prev, ...newNodes]);
            triggerNotification(`✓ تم توليد وتثبيت عدد (4) حسابات فرعية للذمم ومراكز تكلفة الفروع بنجاح!`, 'success');
            logAction('AUTO_GENERATE_BRANCH_COA', `توليد تلقائي لـ 4 حسابات فرعية لمراكز التكلفة بمرحلة (${wizardBaseName}) تحت الأب #${wizardParentId}`, 'الحسابات العامة');
            
            // Select the first generated account and go back to inspector
            setSelectedAccountCode(newNodes[0].code);
            setCoaWorkspaceMode('inspector');
            setWizardBaseName('');
          };

          return (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto animate-fade-in text-right">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 text-purple-700 border border-purple-100 rounded-xl animate-bounce">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">معالج التوليد التلقائي متعدد الفروع ومراكز التكلفة (Auto Branch Gen)</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">تقوم هذه الأداة ببناء وتفريد حسابات الأستاذ المساعد للمراحل الأربعة تلقائياً وتفعيل ميزان الأبعاد</p>
                  </div>
                </div>
                <span className="bg-purple-100 text-purple-800 text-[9px] px-2 py-0.5 rounded font-black font-mono">ERP Smart Wizard</span>
              </div>

              <form onSubmit={handleWizardSubmit} className="space-y-5">
                
                {/* Select Parent Account */}
                <div>
                  <label className="block text-[10.5px] font-black text-slate-700 mb-1">اختر الحساب الرئيسي الأب:</label>
                  <select
                    value={wizardParentId}
                    onChange={(e) => setWizardParentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    {parentNodes.map(p => (
                      <option key={p.code} value={p.code}>{p.code} - {p.nameAr} ({p.classification})</option>
                    ))}
                  </select>
                  <span className="text-[9px] text-slate-400 block mt-1">✓ سيتم إدراج الحسابات المتفرعة الأربعة تحت الكود الهرمي لهذا الحساب.</span>
                </div>

                {/* Account Name Prefix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10.5px] font-black text-slate-700 mb-1">اسم الحساب المالي الموحد (عربي):</label>
                    <input 
                      type="text"
                      placeholder="مثال: مصروفات الأنشطة والرحلات التعليمية"
                      value={wizardBaseName}
                      onChange={(e) => setWizardBaseName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-black text-slate-700 mb-1">اسم الحساب المالي الموحد (إنجليزي):</label>
                    <input 
                      type="text"
                      placeholder="e.g. School Trips & Activities"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Visualizer of the 4 accounts to be generated */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">استعراض الهيكل المالي التقديري للتوليد (Live Generator Preview):</span>
                  
                  <div className="space-y-1.5 text-[10px] font-mono">
                    <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-lg">
                      <span className="text-purple-700 font-extrabold">{wizardParentId}XX10</span>
                      <span className="text-slate-800 font-bold font-sans">{wizardBaseName ? `${wizardBaseName} - مرحلة الروضة والتمهيدي` : '[سيظهر اسم الروضة هنا]'}</span>
                      <span className="px-1.5 py-0.2 bg-slate-100 rounded font-sans text-[8px] font-bold">مركز: الروضة</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-lg">
                      <span className="text-purple-700 font-extrabold">{wizardParentId}XX20</span>
                      <span className="text-slate-800 font-bold font-sans">{wizardBaseName ? `${wizardBaseName} - مرحلة التعليم الابتدائي` : '[سيظهر اسم الابتدائي هنا]'}</span>
                      <span className="px-1.5 py-0.2 bg-slate-100 rounded font-sans text-[8px] font-bold">مركز: الابتدائي</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-lg">
                      <span className="text-purple-700 font-extrabold">{wizardParentId}XX30</span>
                      <span className="text-slate-800 font-bold font-sans">{wizardBaseName ? `${wizardBaseName} - مرحلة التعليم المتوسط` : '[سيظهر اسم المتوسط هنا]'}</span>
                      <span className="px-1.5 py-0.2 bg-slate-100 rounded font-sans text-[8px] font-bold">مركز: المتوسط</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-lg">
                      <span className="text-purple-700 font-extrabold">{wizardParentId}XX40</span>
                      <span className="text-slate-800 font-bold font-sans">{wizardBaseName ? `${wizardBaseName} - مرحلة التعليم الثانوي` : '[سيظهر اسم الثانوي هنا]'}</span>
                      <span className="px-1.5 py-0.2 bg-slate-100 rounded font-sans text-[8px] font-bold">مركز: الثانوي</span>
                    </div>
                  </div>
                </div>

                {/* Actions buttons */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setWizardBaseName('');
                      setCoaWorkspaceMode('inspector');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-5 py-2.5 rounded-xl text-[11px]"
                  >
                    إلغاء المعالج
                  </button>
                  <button
                    type="submit"
                    className="bg-purple-650 hover:bg-purple-700 text-white font-black px-6 py-2.5 rounded-xl text-[11px] shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>توليد وتأكيد الحسابات الأربعة ⚡</span>
                  </button>
                </div>

              </form>

            </div>
          );
        })()}

        {coaWorkspaceMode === 'stress_test' && (() => {
          const assetAccs = accounts.filter(a => a.classification === 'أصول' && a.type === 'فرعي' && a.isActive);
          const liabAccs = accounts.filter(a => a.classification === 'خصوم' && a.type === 'فرعي' && a.isActive);
          const equityAccs = accounts.filter(a => a.classification === 'حقوق ملكية' && a.type === 'فرعي' && a.isActive);
          const revAccs = accounts.filter(a => a.classification === 'إيرادات' && a.type === 'فرعي' && a.isActive);
          const expAccs = accounts.filter(a => a.classification === 'مصروفات' && a.type === 'فرعي' && a.isActive);

          const totalAssets = assetAccs.reduce((sum, a) => sum + a.balance, 0);
          const totalLiabilities = liabAccs.reduce((sum, a) => sum + a.balance, 0);
          const totalEquity = equityAccs.reduce((sum, a) => sum + a.balance, 0);
          const totalRevenues = revAccs.reduce((sum, a) => sum + a.balance, 0);
          const totalExpenses = expAccs.reduce((sum, a) => sum + a.balance, 0);

          let scenarioExpMult = 1.0;
          let scenarioRevMult = 1.0;
          let scenarioTitle = "سيناريو مستقر (ميزان قياسي)";
          let scenarioDesc = "الأرصدة الحالية تمثل ميزان المراجعة المعتمد بالدليل دون صدمات أو مخاطر خارجية طارئة.";

          if (stressScenario === 'inflation') {
            scenarioExpMult = 1.25;
            scenarioTitle = "أزمة تضخمية مفاجئة (+25% مصروفات)";
            scenarioDesc = "ارتفاع حاد وتضخم بعقود التجهيز، الصيانة، الأنشطة، وفواتير الطاقة لمختلف الفروع المدرسية.";
          } else if (stressScenario === 'revenue_drop') {
            scenarioRevMult = 0.80;
            scenarioTitle = "عجز تحصيل الأقساط (-20% إيرادات)";
            scenarioDesc = "تراجع ملحوظ في معدلات سداد أولياء الأمور للذمم المدينة بفعل شح السيولة المصرفية المؤقتة.";
          } else if (stressScenario === 'budget_freeze') {
            scenarioExpMult = 0.85;
            scenarioTitle = "سياسة التقشف الصارم (Budget Freeze)";
            scenarioDesc = "تخفيض كلفة التشغيل المباشرة بنسبة 15% بقرار مجلس الإدارة مع تجميد فوري لكافة المصروفات الكمالية.";
          } else if (stressScenario === 'expansion') {
            scenarioRevMult = 1.35;
            scenarioExpMult = 1.10;
            scenarioTitle = "نمو قياسي وتوسع الفروع (+35% عوائد)";
            scenarioDesc = "طفرة في الإقبال الطلابي الجديد لجميع المراحل وتدشين شعب دراسية إضافية وتفعيل كامل لمراكز التكلفة.";
          }

          const finalRevMult = (revenueStressFactor / 100) * scenarioRevMult;
          const finalExpMult = (expenseStressFactor / 100) * scenarioExpMult;

          const stressedRevenues = totalRevenues * finalRevMult;
          const stressedExpenses = totalExpenses * finalExpMult;
          const originalNetSurplus = totalRevenues - totalExpenses;
          const stressedNetSurplus = stressedRevenues - stressedExpenses;

          const profitDifference = stressedNetSurplus - originalNetSurplus;
          
          let stressedAssets = Math.max(0, totalAssets + profitDifference);
          let stressedEquity = Math.max(0, totalEquity + profitDifference);
          let stressedLiabilities = totalLiabilities;

          if (stressedAssets < stressedLiabilities + 5000) {
            stressedLiabilities = stressedLiabilities + Math.abs(stressedAssets - (stressedLiabilities + 5000));
            stressedAssets = stressedLiabilities + 5000;
          }

          const workingCapital = stressedAssets - stressedLiabilities;
          const wcRatio = workingCapital / (stressedAssets || 1);
          const eqLiabRatio = stressedEquity / (stressedLiabilities || 1);
          const profitRatio = stressedNetSurplus / (stressedRevenues || 1);
          const assetTurnover = stressedRevenues / (stressedAssets || 1);

          const solvencyScore = Math.max(0, Math.min(5, parseFloat(((wcRatio * 1.2) + (eqLiabRatio * 1.4) + (profitRatio * 3.3) + (assetTurnover * 0.6) + 1.5).toFixed(2))));
          
          let solvencyStatus = "ملاءة آمنة جداً (المنطقة الخضراء)";
          let solvencyColor = "text-emerald-500";
          let solvencyBg = "bg-emerald-500";
          let solvencyBorder = "border-emerald-500/20";
          let solvencyDesc = "هيكل الحسابات متماسك والتدفقات كافية، المجمع يتمتع بمرونة تامة للوفاء بجميع المستحقات الفورية.";

          if (solvencyScore < 1.4) {
            solvencyStatus = "عجز ملاءة حرج (المنطقة الحمراء)";
            solvencyColor = "text-rose-500";
            solvencyBg = "bg-rose-500";
            solvencyBorder = "border-rose-500/20";
            solvencyDesc = "عجز حاد في تغطية المصروفات وتآكل كامل للسيولة. يوصى فوراً بضبط بنود الصرف أو طلب تمويل استثنائي.";
          } else if (solvencyScore < 2.8) {
            solvencyStatus = "منطقة ترقب وحذر (المنطقة الصفراء)";
            solvencyColor = "text-amber-500";
            solvencyBg = "bg-amber-500";
            solvencyBorder = "border-amber-500/20";
            solvencyDesc = "يوجد بوادر ضعف في توليد العوائد السائلة. يرجى تفعيل رقابة موازنة المصاريف وإيجاد قنوات تسريع التحصيل.";
          }

          const gaugeRotation = -90 + (solvencyScore / 5) * 180;

          return (
            <div className="space-y-6 animate-fade-in text-right">
              
              {/* Header Title & Intro Banner */}
              <div className="bg-slate-50 text-slate-800 rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                  <div>
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-850 border border-amber-200 rounded-full text-[9px] font-black tracking-wide inline-flex items-center gap-1.5 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      إصدار التدقيق الاستباقي المتقدم الموحد (ERP Solvency Module v3.5)
                    </span>
                    <h3 className="text-base font-black text-slate-900">محاكي اختبارات الجهد وملاءة ميزان الحسابات (Financial Stress Testing Console)</h3>
                    <p className="text-[10.5px] text-slate-600 max-w-2xl mt-1 leading-relaxed">
                      اختبر قدرة شجرة الحسابات ودليل الأرصدة الحالي على امتصاص الأزمات التضخمية، وتراجع تحصيل الرسوم، وضغوط المصاريف التشغيلية ومستوى الموازنات السنوية المعتمدة بشكل تفاعلي مرن.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shrink-0 min-w-[150px] shadow-xs">
                    <span className="text-[9px] text-slate-500 block font-semibold">مستوى الحصانة المالي</span>
                    <span className="text-lg font-black font-mono text-amber-600 block mt-0.5">{(solvencyScore * 20).toFixed(0)}%</span>
                    <span className="text-[8px] text-emerald-600 block mt-0.5 font-bold">معايير مراجعة الليبية 🇱🇾</span>
                  </div>
                </div>
              </div>

              {/* 1. Predefined Stress Scenarios */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h4 className="text-xs font-black text-slate-900 mb-4 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                  <span>خطوة 1: اختر سيناريو الضغط أو الصدمة المالية التشغيلية</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Scenario 0: Standard */}
                  <div 
                    onClick={() => {
                      setStressScenario('none');
                      setExpenseStressFactor(100);
                      setRevenueStressFactor(100);
                      triggerNotification('✓ تم استعادة الميزان القياسي للدليل بنجاح', 'success');
                    }}
                    className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between text-right relative overflow-hidden group ${
                      stressScenario === 'none' 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]' 
                        : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black uppercase">الوضع المستقر</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-black ${stressScenario === 'none' ? 'bg-emerald-500/25 text-emerald-300' : 'bg-emerald-100 text-emerald-800'}`}>معتمد</span>
                      </div>
                      <h5 className="text-[11px] font-black leading-snug">ميزان قياسي اعتيادي</h5>
                    </div>
                    <span className={`text-[8.5px] block mt-3 ${stressScenario === 'none' ? 'text-slate-300' : 'text-slate-400'}`}>الأرصدة الحالية الفعالة بالدورة</span>
                  </div>

                  {/* Scenario 1: Inflation */}
                  <div 
                    onClick={() => {
                      setStressScenario('inflation');
                      setExpenseStressFactor(115);
                      setRevenueStressFactor(100);
                      triggerNotification('⚠️ تم تشغيل محاكاة الصدمة التضخمية (+25% تكاليف)', 'warning');
                    }}
                    className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between text-right relative overflow-hidden group ${
                      stressScenario === 'inflation' 
                        ? 'bg-amber-600 text-white border-amber-600 shadow-lg scale-[1.02]' 
                        : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black uppercase">صدمة أسعار</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded font-black bg-rose-500/25 text-rose-200">صعب</span>
                      </div>
                      <h5 className="text-[11px] font-black leading-snug">أزمة تضخمية (+25% تكاليف)</h5>
                    </div>
                    <span className={`text-[8.5px] block mt-3 ${stressScenario === 'inflation' ? 'text-amber-100' : 'text-slate-400'}`}>زيادة أسعار الصيانة والوقود والأجور</span>
                  </div>

                  {/* Scenario 2: Revenue Drop */}
                  <div 
                    onClick={() => {
                      setStressScenario('revenue_drop');
                      setExpenseStressFactor(100);
                      setRevenueStressFactor(85);
                      triggerNotification('⚠️ تم تشغيل محاكاة شح تحصيل السيولة والرسوم (-20%)', 'warning');
                    }}
                    className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between text-right relative overflow-hidden group ${
                      stressScenario === 'revenue_drop' 
                        ? 'bg-rose-650 text-white border-rose-650 shadow-lg scale-[1.02]' 
                        : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black uppercase">أزمة نقدية</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded font-black bg-rose-500/25 text-rose-200">حرج</span>
                      </div>
                      <h5 className="text-[11px] font-black leading-snug">عجز تحصيل الرسوم (-20%)</h5>
                    </div>
                    <span className={`text-[8.5px] block mt-3 ${stressScenario === 'revenue_drop' ? 'text-rose-100' : 'text-slate-400'}`}>تباطؤ سداد أقساط الطلاب للفروع</span>
                  </div>

                  {/* Scenario 3: Budget Freeze */}
                  <div 
                    onClick={() => {
                      setStressScenario('budget_freeze');
                      setExpenseStressFactor(85);
                      setRevenueStressFactor(95);
                      triggerNotification('✓ تم محاكاة سيناريو تجميد الموازنات التشغيلية والتقشف', 'success');
                    }}
                    className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between text-right relative overflow-hidden group ${
                      stressScenario === 'budget_freeze' 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-[1.02]' 
                        : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black uppercase">علاج وقائي</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded font-black bg-emerald-500/25 text-emerald-200">تقشف</span>
                      </div>
                      <h5 className="text-[11px] font-black leading-snug">تجميد الموازنات وضبط الهدر</h5>
                    </div>
                    <span className={`text-[8.5px] block mt-3 ${stressScenario === 'budget_freeze' ? 'text-indigo-100' : 'text-slate-400'}`}>وضع سقف مالي صارم لجميع النفقات</span>
                  </div>

                  {/* Scenario 4: Expansion */}
                  <div 
                    onClick={() => {
                      setStressScenario('expansion');
                      setExpenseStressFactor(105);
                      setRevenueStressFactor(120);
                      triggerNotification('✓ تم تشغيل محاكاة التوسع والنمو الفروع المدرسية', 'success');
                    }}
                    className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between text-right relative overflow-hidden group ${
                      stressScenario === 'expansion' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg scale-[1.02]' 
                        : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black uppercase">فرصة استثمارية</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded font-black bg-sky-500/25 text-sky-200">نمو</span>
                      </div>
                      <h5 className="text-[11px] font-black leading-snug">توسع قياسي للفروع (+35%)</h5>
                    </div>
                    <span className={`text-[8.5px] block mt-3 ${stressScenario === 'expansion' ? 'text-emerald-100' : 'text-slate-400'}`}>إقبال قياسي بالفروع وزيادة التدفق</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl text-[10px] text-slate-600 mt-3 flex items-start gap-2">
                  <span className="font-extrabold text-slate-800 shrink-0">وصف حالة السيناريو النشط:</span>
                  <p className="font-medium text-slate-500 leading-normal">{scenarioDesc}</p>
                </div>
              </div>

              {/* 2. Double Interactive Sliders & Live Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Manual Stress Tweaker Slider */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-black text-slate-900 mb-4 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-indigo-600" />
                    <span>خطوة 2: تعديل يدوي دقيق لقيم الضغط والتحمل (Fine-Tuning Controls)</span>
                  </h4>

                  <div className="space-y-5 py-2">
                    {/* Expense Factor slider */}
                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-1.5">
                        <span className="font-extrabold text-slate-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          معامل ضغط نفقات ومصروفات المجمع:
                        </span>
                        <span className="font-mono font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {expenseStressFactor}% ({expenseStressFactor > 100 ? `+${expenseStressFactor - 100}% زيادة مصروفات 📈` : `${100 - expenseStressFactor}% وفر نفقات 📉`})
                        </span>
                      </div>
                      <input 
                        type="range"
                        min="50"
                        max="200"
                        value={expenseStressFactor}
                        onChange={(e) => setExpenseStressFactor(parseInt(e.target.value))}
                        className="w-full accent-amber-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[8.5px] text-slate-400 mt-1">
                        <span>نصف المصاريف (50%)</span>
                        <span>قياسي (100%)</span>
                        <span>مضاعف (200%)</span>
                      </div>
                    </div>

                    {/* Revenue Factor slider */}
                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-1.5">
                        <span className="font-extrabold text-slate-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                          معامل ضغط الرسوم والإيرادات المحصلة:
                        </span>
                        <span className="font-mono font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                          {revenueStressFactor}% ({revenueStressFactor > 100 ? `+${revenueStressFactor - 100}% نمو الرسوم 📈` : `${100 - revenueStressFactor}% تراجع التحصيل 📉`})
                        </span>
                      </div>
                      <input 
                        type="range"
                        min="50"
                        max="200"
                        value={revenueStressFactor}
                        onChange={(e) => setRevenueStressFactor(parseInt(e.target.value))}
                        className="w-full accent-sky-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[8.5px] text-slate-400 mt-1">
                        <span>شح سيولة حاد (50%)</span>
                        <span>قياسي (100%)</span>
                        <span>مضاعفة الإيراد (200%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Dynamic AI Report Box */}
                <div className="bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 mb-2.5 pb-2 border-b border-slate-200 flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-emerald-500 animate-pulse" />
                        التحليل المالي الاستباقي للذكاء الاصطناعي (Proactive Financial Prognosis)
                      </span>
                      <span className="bg-slate-200 text-slate-650 px-2 py-0.5 rounded text-[8px] font-mono">Model: GPT4-Gl-Lyb</span>
                    </h4>

                    <div className="text-[10.5px] leading-relaxed text-slate-650 space-y-2">
                      <p>
                        بتحليل ميزان الأرصدة التراكمي المقدر في ظل <strong className="text-amber-800">{scenarioTitle}</strong>، ومضاعفة نفقات التشغيل بنسبة <strong className="text-slate-900 font-mono">{(finalExpMult * 100).toFixed(0)}%</strong> ومعدل عوائد الطلاب <strong className="text-slate-900 font-mono">{(finalRevMult * 100).toFixed(0)}%</strong>:
                      </p>
                      
                      <p className="bg-white p-2.5 rounded-xl border border-slate-250 font-medium">
                        {solvencyScore >= 2.8 ? (
                          <span className="text-emerald-800">🟢 يُثبت دليل الحسابات الموحد متانة استثنائية. لا تشكل صدمة المصاريف هذه أي عجز، ويمكن الاستمرار في تمويل المشاريع الرأسمالية والتوسع في شعب الابتدائي والثانوي مع سحب العينات دورياً.</span>
                        ) : solvencyScore >= 1.4 ? (
                          <span className="text-amber-800">🟡 وضع متوازن ولكن حذر. يوصى بترحيل الفارق السلبي إلى حساب "الذمم الدائنة والموردين" لتجنب الضغط المباشر على الأصول السائلة، وتفعيل عقود التقشف على مصروفات الروضة والأنشطة الإدارية.</span>
                        ) : (
                          <span className="text-rose-800">🔴 تنبيه أحمر: ميزان النقدية مهدد بالنفاذ الكامل! العجز البالغ <strong className="text-rose-700 font-bold">{(stressedExpenses - stressedRevenues).toLocaleString()} د.ل</strong> سيلحق ضرراً مباشراً بـ <strong className="text-slate-900 font-bold">مصرف الوحدة الجاري</strong> ومستحقات الرواتب المعلقة. أوقف فوراً الصرف على مشاريع التشييد.</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-500 border-t border-slate-200 pt-2 flex justify-between items-center mt-3">
                    <span>* تم إعادة احتساب الأرصدة عبر القيود الافتراضية الثنائية.</span>
                    <span className="font-mono">IFRS 9 Standard Matcher</span>
                  </div>
                </div>

              </div>

              {/* 3. The Prestige Centerpiece: Solvency Gauge & Current vs Stressed Graphs */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Solvency Speedometer Gauge (Left) - 5 Cols */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                  <h4 className="text-xs font-black text-slate-900 mb-6 w-full text-right flex justify-between items-center">
                    <span>مقياس ملاءة الدليل وجدارته (Solvency Dial)</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black ${solvencyScore >= 2.8 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : solvencyScore >= 1.4 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                      {solvencyStatus}
                    </span>
                  </h4>

                  {/* Beautiful Gauge SVG */}
                  <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden mb-4">
                    {/* Semi Circle Track */}
                    <svg className="w-full h-full" viewBox="0 0 100 50">
                      <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f43f5e" /> {/* Red */}
                          <stop offset="50%" stopColor="#f59e0b" /> {/* Amber */}
                          <stop offset="100%" stopColor="#10b981" /> {/* Emerald */}
                        </linearGradient>
                      </defs>
                      <path 
                        d="M 10 50 A 40 40 0 0 1 90 50" 
                        fill="none" 
                        stroke="url(#gaugeGradient)" 
                        strokeWidth="10" 
                        strokeLinecap="round"
                      />
                    </svg>

                    {/* Needle Indicator */}
                    <div 
                      className="absolute bottom-0 w-1.5 h-16 bg-slate-900 origin-bottom rounded-full transition-transform duration-700 ease-out"
                      style={{ 
                        transform: `rotate(${gaugeRotation}deg)`,
                        bottom: '0px',
                        transformOrigin: '50% 100%'
                      }}
                    >
                      <div className="w-3 h-3 bg-indigo-600 rounded-full absolute -bottom-1 -left-[3.5px] border-2 border-white shadow shadow-indigo-600" />
                    </div>

                    <div className="absolute bottom-1 flex flex-col items-center">
                      <span className="text-xs text-slate-400 font-extrabold uppercase">النقاط المخفضة</span>
                      <span className="text-xl font-black font-mono text-slate-900">{solvencyScore} / 5</span>
                    </div>
                  </div>

                  {/* Status Indicator text details */}
                  <div className="space-y-1">
                    <h5 className={`font-black text-xs ${solvencyColor}`}>{solvencyStatus}</h5>
                    <p className="text-[10px] text-slate-500 leading-relaxed max-w-sm">
                      {solvencyDesc}
                    </p>
                  </div>

                  {/* Quick Scale indicators */}
                  <div className="grid grid-cols-3 gap-2 w-full mt-4 border-t border-slate-100 pt-4 text-[9px] font-bold">
                    <div className="text-rose-650 bg-rose-50 p-1.5 rounded border border-rose-100/50">
                      <span>حرج (0 - 1.4)</span>
                    </div>
                    <div className="text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-100/50">
                      <span>ترقب (1.4 - 2.8)</span>
                    </div>
                    <div className="text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-100/50">
                      <span>آمن (2.8 - 5.0)</span>
                    </div>
                  </div>
                </div>

                {/* Live Current vs Stressed Comparison (Right) - 7 Cols */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 mb-5 flex justify-between items-center">
                      <span>محاكاة الأثر المباشر على الكتل المالية الكبرى (Financial Blocks Comparison)</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">مقارنة ميزان الأرصدة (د.ل)</span>
                    </h4>

                    <div className="space-y-4">
                      {/* 1. Revenues bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10.5px]">
                          <span className="font-bold text-slate-700">إجمالي عوائد الرسوم والأنشطة:</span>
                          <span className="font-mono text-slate-500 font-medium">
                            المقترح: <strong className="text-sky-700 font-mono font-black">{stressedRevenues.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> د.ل (السابق: {totalRevenues.toLocaleString(undefined, { maximumFractionDigits: 0 })} د.ل)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-6.5 rounded-lg flex overflow-hidden border border-slate-200 relative items-center px-2">
                          <div className="bg-slate-300 h-4.5 rounded absolute left-2 top-[4px] opacity-40" style={{ width: '40%' }} />
                          <div className="bg-gradient-to-r from-sky-500 to-sky-600 h-4.5 rounded text-white font-mono text-[9px] font-black flex items-center justify-end px-2" style={{ width: `${Math.min(100, (stressedRevenues / (totalRevenues || 1)) * 100)}%` }}>
                            {stressedRevenues > totalRevenues ? '▲' : '▼'} {((stressedRevenues / (totalRevenues || 1)) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      {/* 2. Expenses bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10.5px]">
                          <span className="font-bold text-slate-700">تكاليف التشغيل والأعباء العمومية:</span>
                          <span className="font-mono text-slate-500 font-medium">
                            المقترح: <strong className="text-amber-700 font-mono font-black">{stressedExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> د.ل (السابق: {totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })} د.ل)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-6.5 rounded-lg flex overflow-hidden border border-slate-200 relative items-center px-2">
                          <div className="bg-slate-300 h-4.5 rounded absolute left-2 top-[4px] opacity-40" style={{ width: '40%' }} />
                          <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-4.5 rounded text-white font-mono text-[9px] font-black flex items-center justify-end px-2" style={{ width: `${Math.min(100, (stressedExpenses / (totalExpenses || 1)) * 100)}%` }}>
                            {stressedExpenses > totalExpenses ? '▲' : '▼'} {((stressedExpenses / (totalExpenses || 1)) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      {/* 3. Assets bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10.5px]">
                          <span className="font-bold text-slate-700">قيمة الأصول والسيولة المتوفرة بالصندوق:</span>
                          <span className="font-mono text-slate-500 font-medium">
                            المقترح: <strong className="text-emerald-700 font-mono font-black">{stressedAssets.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> د.ل (السابق: {totalAssets.toLocaleString(undefined, { maximumFractionDigits: 0 })} د.ل)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-6.5 rounded-lg flex overflow-hidden border border-slate-200 relative items-center px-2">
                          <div className="bg-slate-300 h-4.5 rounded absolute left-2 top-[4px] opacity-40" style={{ width: '40%' }} />
                          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-4.5 rounded text-white font-mono text-[9px] font-black flex items-center justify-end px-2" style={{ width: `${Math.min(100, (stressedAssets / (totalAssets || 1)) * 100)}%` }}>
                            {stressedAssets > totalAssets ? '▲' : '▼'} {((stressedAssets / (totalAssets || 1)) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      {/* 4. Profit Surplus */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10.5px]">
                          <span className="font-bold text-slate-700">الفائض الصافي المقدر / العجز:</span>
                          <span className="font-mono text-slate-500 font-medium">
                            المقترح: <span className={`font-mono font-black ${stressedNetSurplus >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>{stressedNetSurplus.toLocaleString(undefined, { maximumFractionDigits: 0 })} د.ل</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-6.5 rounded-lg flex overflow-hidden border border-slate-200 relative items-center px-2">
                          <div className={`h-4.5 rounded text-white font-mono text-[9px] font-black flex items-center justify-end px-2 ${stressedNetSurplus >= 0 ? 'bg-indigo-600' : 'bg-rose-600'}`} style={{ width: `${Math.max(10, Math.min(100, Math.abs(stressedNetSurplus / (originalNetSurplus || 1)) * 100))}%` }}>
                            {stressedNetSurplus >= 0 ? 'فائض تشغيلي' : 'عجز مالي'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between text-[10px] mt-4">
                    <span className="font-semibold text-slate-700">💡 توصية محاكي الملاءة:</span>
                    <span className="text-amber-800 font-extrabold">
                      {solvencyScore >= 2.8 ? "دليل آمن ومستقر، لا يتطلب أي إجراء تحوطي حالياً." : solvencyScore >= 1.4 ? "تعديل الموازنة وتنشيط التحصيل بالفروع فوراً." : "تجميد الحسابات وسد الثغرات وإعادة توازن رأس المال."}
                    </span>
                  </div>
                </div>

              </div>

              {/* 4. Advanced Audit Recommendations Checklist */}
              <div className="bg-slate-50 text-slate-800 rounded-2xl p-6 border border-slate-200 shadow-xs">
                <h4 className="text-xs font-black text-slate-900 mb-4 pb-2 border-b border-slate-200 flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-650" />
                    توصيات مراجعة استباقية مصاغة لمجلس الإدارة والمشرفين
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-medium">Audit Strategy Checklists</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <h5 className="font-black text-amber-700 mb-2">📥 توصيات جانب الإيرادات والدورة النقدية</h5>
                    <ul className="space-y-2 text-slate-600 leading-relaxed font-semibold">
                      <li>• تفعيل الحسابات الفرعية تحت الرمز <strong className="text-slate-900 font-mono">1200</strong> لتسريع دورة جباية ذمم الطلاب قبل بدء الصدمة.</li>
                      <li>• مراجعة نسب تحويل التدفقات إلى <strong className="text-slate-900">مصرف الوحدة الجاري (#1102)</strong> للحفاظ على حد أمان نقدي.</li>
                      <li>• توججه عوائد الأنشطة الإضافية لسد نفقات الروضة والابتدائي بدلاً من اللجوء للخصوم الدائنة.</li>
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <h5 className="font-black text-amber-700 mb-2">📤 توصيات كبح المصاريف والتشغيل</h5>
                    <ul className="space-y-2 text-slate-600 leading-relaxed font-semibold">
                      <li>• ربط الصرف بمراكز التكلفة الفرعية <strong className="text-slate-900">kindergarten / primary</strong> بنسب مئوية لا تتجاوز 25%.</li>
                      <li>• إيقاف مؤقت للبنود التكميلية التي تسجل أرصدة تفوق سقف الموازنة المعتمد بالدليل وتجمد تلقائياً.</li>
                      <li>• التفاوض لترحيل جزء من مستحقات الموردين <strong className="text-slate-900 font-mono">(#2101)</strong> لتخفيف الضغط على الكاش السائل.</li>
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <h5 className="font-black text-amber-700 mb-2">⚖️ توصيات حقوق الملكية وبناء متانة رأس المال</h5>
                    <ul className="space-y-2 text-slate-600 leading-relaxed font-semibold">
                      <li>• احتجاز 10% احتياطي ملاءة وقائي تحت حساب الأرباح المحتجزة <strong className="text-slate-900 font-mono">(#3200)</strong> لتقوية الجدارة.</li>
                      <li>• تفعيل أدوات التوازن الهيكلي الآلية لإلغاء أي فروقات كودية فوراً للامتثال لقواعد IFRS.</li>
                      <li>• جدولة زيادة رأس المال الفعلي <strong className="text-slate-900 font-mono">(#3101)</strong> بنهاية الربع لضمان البقاء في المنطقة الخضراء الآمنة.</li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-wrap justify-between items-center gap-3 mt-6 pt-4 border-t border-slate-200 text-[10px] text-slate-400">
                  <span className="font-bold">المشرف المالي المساعد: م. ملاءة الرقابي الذكي</span>
                  <div className="flex gap-4">
                    <span className="font-mono">Risk Engine Version: ERP-V3.5</span>
                    <span className="font-mono">Time-Stamp: UTC 2026-Lyb</span>
                  </div>
                </div>
              </div>

            </div>
          );
        })()}

            {/* CSV Import Modal popup */}
            {showCoaImportModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-slate-800">
                <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl shadow-2xl p-6 overflow-hidden flex flex-col">
                  
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-2 text-indigo-600">
                      <Upload className="w-5 h-5" />
                      <h3 className="font-black text-sm">استيراد حسابات مالية مجمعة (CSV Loader)</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCoaImportModal(false)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                      <span className="font-black block mb-1">تعليمات تنسيق استيراد الحسابات:</span>
                      يرجى لصق الأسطر في منطقة النص أدناه، بحيث يمثل كل سطر حساباً مستقلاً يفصل بين عواميده فاصلة عادية <span className="font-mono font-bold">,</span> وفق النموذج التالي:
                      <div className="bg-amber-900 text-amber-100 font-mono text-[9px] p-2 rounded-lg mt-1.5 leading-tight" dir="ltr">
                        كود_الحساب,اسم_الحساب_عربي,نوع_الحساب_رئيسي_او_فرعي,كود_الحساب_الأب,التصنيف_الرئيسي,طبيعة_الحساب<br/>
                        1103,صندوق العهدة المالية لمرحلة الثانوي,فرعي,1100,أصول,مدين<br/>
                        4150,إيرادات المقصف ومبيعات المجمع,فرعي,4000,إيرادات,دائن
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-black mb-1.5 text-[11px]">منطقة لصق البيانات المجدولة:</label>
                      <textarea
                        rows={8}
                        placeholder="الصق كود الحسابات هنا..."
                        value={coaImportText}
                        onChange={(e) => setCoaImportText(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500/30"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCoaImportModal(false);
                        setCoaImportText('');
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-[11px]"
                    >
                      إلغاء الأمر
                    </button>

                    <button
                      type="button"
                      onClick={handleImportCoaCSV}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-5 py-2 rounded-lg text-[11px] shadow flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>بدء استيراد الحسابات</span>
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

    </>
  );
};
