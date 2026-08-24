import { Activity, AlertTriangle, ArrowLeftRight, Barcode, Building2, Calculator, Calendar, CheckCircle, CheckCircle2, ChevronDown, DollarSign, Download, Edit, Edit3, ExternalLink, FileSpreadsheet, FileText, Filter, History as HistoryIcon, MapPin, Paperclip, Play, Plus, Printer, RefreshCw, Save, Search, Trash2, TrendingUp, Wrench, XCircle } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { AccountingContext } from '../../../components/GeneralLedgerPortal';
import { triggerNotification } from '../../../lib/notifications';

export const FixedAssetsTab = () => {
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
  fixedAssets, setFixedAssets, selectedAssetId, setSelectedAssetId, activeAssetTab, setActiveAssetTab,
  isEditAssetMode, setIsEditAssetMode, isNewAssetMode, setIsNewAssetMode,
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
  formatCurrency, canonicalFinancialStatus, canonicalFinancialWriteMode
} = React.useContext(AccountingContext);
  const fixedAssetWritesAreCanonical = canonicalFinancialStatus === 'ready' && canonicalFinancialWriteMode === 'ledger_ready';
  const fixedAssetWritesAvailable = canonicalFinancialStatus === 'ready' && canonicalFinancialWriteMode !== 'snapshot_read_only';
  
  const [assetActionModal, setAssetActionModal] = useState<'none' | 'maintenance' | 'transfer' | 'sale' | 'discard' | 'print_card' | 'print_schedule'>('none');
  const [selectedAssetsForAction, setSelectedAssetsForAction] = useState<string>('all_assets');
    
  const handleViewAssetDetails = (assetId: string) => {
    setSelectedAssetId(assetId);
    const asset = fixedAssets.find(a => a.id === assetId);
    if (asset) {
      setAssetForm({ ...asset });
    }
    setActiveAssetTab('basic');
  };


  return (
    <>
              {activeTab === 'fixed_assets' && (
          <div className="space-y-6 animate-fade-in text-xs">
            {/* Top Bar with Mode Toggle */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 pb-4 gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <span>منظومة إدارة وجرد الأصول الثابتة والعهد (ERP Fixed Assets)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  تتبع دورة حياة الأصول بالكامل من الشراء والرسملة، الصيانة الدورية، انتقال العهدة، احتساب استهلاك القسط الثابت، والبيع والاستبعاد المحاسبي التلقائي
                </p>
              </div>

              {/* Actions & View/Mode Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                <button
                  type="button"
                  onClick={handleImportExcelSimulate}
                  disabled={!fixedAssetWritesAvailable}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer text-xs shadow-xs disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{fixedAssetWritesAvailable ? 'استيراد جماعي Excel' : 'الاستيراد غير متاح — قراءة فقط'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 font-black px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>تنزيل قالب الاستيراد</span>
                </button>

                <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                <div className="flex items-center bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setFixedAssetViewMode('management');
                      if (!activeAssetTab || activeAssetTab === 'all_assets') setActiveAssetTab('basic');
                    }}
                    className={`px-4 py-2 rounded-md font-bold text-xs transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                      fixedAssetViewMode === 'management'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>إدارة الأصول والعمليات</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFixedAssetViewMode('reports');
                      setFixedAssetReportType('all_assets');
                      setActiveAssetTab('all_assets');
                    }}
                    className={`px-4 py-2 rounded-md font-bold text-xs transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                      fixedAssetViewMode === 'reports'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>سجل التقارير والتحليلات</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Alerts Box */}
            {fixedAssetViewMode === 'management' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Alert 1: Warranty & Maintenance */}
                {(() => {
                  const mAsset = fixedAssets.find(a => a.maintenanceLogs && a.maintenanceLogs.length > 0);
                  const mName = mAsset ? mAsset.name : 'لا يوجد أصل موثق للصيانة';
                  const mCode = mAsset ? mAsset.id : '—';
                  return (
                    <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
                      <div className="bg-amber-100 text-amber-800 p-2 rounded-lg">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 mb-0.5">خطط صيانة الأصول والمتابعة</h4>
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                          {mAsset ? `الأصل ${mName} (${mCode}) يخضع لخطط تتبع الصيانة الدورية.` : 'لا توجد سجلات صيانة موثقة في المصدر المركزي لهذا النطاق.'}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Alert 2: Useful Life Near End */}
                {(() => {
                  const depAsset = fixedAssets.find(a => Number(a.accDep) > 0 && (Number(a.accDep) / (Number(a.cost) || 1)) >= 0.5);
                  const depRatio = depAsset ? Math.round((Number(depAsset.accDep) / (Number(depAsset.cost) || 1)) * 100) : 0;
                  const depName = depAsset ? depAsset.name : 'لا يوجد أصل موثق قريب من نهاية عمره';
                  const depCode = depAsset ? depAsset.id : '—';
                  return (
                    <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-3">
                      <div className="bg-rose-100 text-rose-800 p-2 rounded-lg">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 mb-0.5">تنبيهات استهلاك وإهلاك الأصول</h4>
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                          {depAsset ? `الأصل ${depName} (${depCode}) استهلك ${depRatio}% من عمره الإنتاجي.` : 'لا توجد بيانات استهلاك موثقة تكفي لإصدار تنبيه.'}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Alert 3: GL Connection Status */}
                <div className={`${fixedAssetWritesAvailable ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'} border rounded-xl p-3.5 flex items-start gap-3`}>
                      <div className={`${fixedAssetWritesAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} p-2 rounded-lg`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                        <h4 className="font-extrabold text-slate-900 mb-0.5">حالة ربط القيود بالأستاذ العام</h4>
                        <p className="text-[10px] text-slate-700 font-semibold leading-relaxed">
                          {fixedAssetWritesAvailable ? (fixedAssetWritesAreCanonical ? 'المصدر المالي المركزي متصل؛ لا يعتمد ترحيل أي حركة أصول إلا بعد حفظ قيد موثق.' : 'الكتابة المركزية UAT متاحة لحفظ سجل الأصل؛ لا يُعد ذلك ترحيلاً نهائياً في دفتر الأستاذ العام.') : 'المصدر الحالي snapshot للقراءة فقط؛ تم إيقاف ترحيل واستيراد أي حركة أصول.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW A: LIFECYCLE MANAGEMENT WORKSPACE */}
            {fixedAssetViewMode === 'management' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* 1. MASTER VIEW: ASSET LISTING & SEARCH FILTERS (COL SPAN 4) */}
                <div className="xl:col-span-4 space-y-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-black text-xs text-slate-900">سجل جرد ومطابقة الأصول</span>
                      <span className="bg-slate-100 font-mono text-[10px] text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        إجمالي: {fixedAssets.length}
                      </span>
                    </div>

                    {/* Quick Search */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="البحث بالاسم، الكود، الباركود..."
                        value={assetSearchQuery}
                        onChange={(e) => setAssetSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pr-8 text-right font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
                    </div>

                    {/* Quick filters */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label className="block text-slate-500 mb-1 font-bold">التصنيف:</label>
                        <select
                          value={assetCategoryFilter}
                          onChange={(e) => setAssetCategoryFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold focus:outline-none"
                        >
                          <option value="all">كل التصنيفات</option>
                          <option value="سيارات وحافلات">سيارات وحافلات</option>
                          <option value="أجهزة ومعدات مختبرية">أجهزة مختبرية</option>
                          <option value="أثاث وتجهيزات مدرسية">أثاث وتجهيزات</option>
                          <option value="أجهزة ومولدات طاقة">مولدات وأجهزة طاقة</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1 font-bold">حالة الأصل:</label>
                        <select
                          value={assetStatusFilter}
                          onChange={(e) => setAssetStatusFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold focus:outline-none"
                        >
                          <option value="all">كل الحالات</option>
                          <option value="نشط / قيد التشغيل">نشط / يعمل</option>
                          <option value="مستبعد">مستبعد / كهنة</option>
                          <option value="تم بيعه">تم بيعه</option>
                        </select>
                      </div>
                    </div>

                    {/* Refresh & Reset Filters Trigger */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAssetSearchQuery('');
                          setAssetCategoryFilter('all');
                          setAssetStatusFilter('all');
                          setAssetCostCenterFilter('all');
                          triggerNotification('🔄 تم تحديث السجل وإعادة تعيين فلاتر التصفية والتطابق.', 'success');
                        }}
                        className="text-indigo-600 hover:text-indigo-800 text-[10px] font-black flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>تحديث قائمة الأصول وإعادة تعيين التصفية</span>
                      </button>
                    </div>
                  </div>

                  {/* Asset Cards List */}
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {fixedAssets.filter(asset => {
                        const matchesSearch = String(asset.name || '').toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                                              String(asset.code || '').toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                                              String(asset.id || '').toLowerCase().includes(assetSearchQuery.toLowerCase());
                        const matchesCat = assetCategoryFilter === 'all' || asset.category === assetCategoryFilter;
                        const matchesStatus = assetStatusFilter === 'all' || asset.status === assetStatusFilter;
                        return matchesSearch && matchesCat && matchesStatus;
                      })
                        .map((asset) => {
                        const isSelected = asset.id === selectedAssetId;
                        return (
                          <div
                            key={asset.id}
                            onClick={() => handleSelectAsset(asset.id)}
                            className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer text-right relative overflow-hidden ${
                              isSelected
                                ? 'bg-indigo-50/40 border-indigo-300 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50/40'
                            }`}
                          >
                            {/* Decorative Top Accent for active card */}
                            {isSelected && (
                              <div className="absolute top-0 right-0 left-0 h-1 bg-indigo-600"></div>
                            )}

                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="font-mono text-[9px] text-slate-400 font-extrabold block">
                                  {asset.code}
                                </span>
                                <h3 className="font-extrabold text-slate-900 text-xs mt-0.5 line-clamp-1">
                                  {asset.name}
                                </h3>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black border self-start ${
                                asset.status === 'نشط / قيد التشغيل' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                                asset.status === 'تم بيعه' ? 'bg-blue-50 text-blue-800 border-blue-100' :
                                'bg-rose-50 text-rose-800 border-rose-100'
                              }`}>
                                {asset.status === 'نشط / قيد التشغيل' ? 'نشط' : asset.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3.5 border-t border-slate-100 text-center font-mono text-[9px] text-slate-500 font-bold">
                              <div>
                                <span className="text-[8px] text-slate-400 block mb-0.5">التكلفة التاريخية:</span>
                                <span className="text-slate-800">{asset.cost.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-400 block mb-0.5">مجمع الإهلاك:</span>
                                <span className="text-rose-500">{asset.accDep.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-400 block mb-0.5">القيمة الدفترية:</span>
                                <span className="text-emerald-600 font-black">{asset.netValue.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    {fixedAssets.length === 0 && (
                      <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <span className="text-slate-400 font-bold">لم يتم العثور على أصول مطابقة للفلاتر.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. DETAIL VIEW: DETAILED TABS & OPERATIONS TOOLBAR (COL SPAN 8) */}
                <div className="xl:col-span-8 space-y-4">
                  {/* Selected Asset Header Card */}
                  <div className="bg-slate-50 text-slate-850 rounded-xl p-5 shadow-xs relative overflow-hidden border border-slate-200">
                    <div className="absolute left-6 top-6 text-4xl text-slate-200/50 font-black font-mono select-none">
                      {assetForm.id || 'FA-XX'}
                    </div>

                    <div className="relative z-10 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded text-[9px] font-black tracking-wide font-mono">
                          {assetForm.category}
                        </span>
                        <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[9px] font-bold">
                          المسؤول: {assetForm.responsible || 'غير محدد'}
                        </span>
                        <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[9px] font-bold">
                          موقع الأصل: {assetForm.location || 'غير محدد'}
                        </span>
                      </div>

                      <div>
                        <h2 className="text-base font-black text-slate-900 leading-relaxed">
                          {isNewAssetMode ? '🆕 تسجيل وتعريف أصل مالي جديد' : assetForm.name}
                        </h2>
                        <p className="text-[10px] text-slate-550 font-semibold font-mono mt-0.5">
                          رمز التتبع للأصل (كود): {assetForm.code} | رقم الباركود: {assetForm.barcode}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 text-right">
                        <div>
                          <span className="text-[9px] text-slate-500 block mb-0.5">التكلفة التاريخية:</span>
                          <span className="font-mono text-xs font-black text-slate-900">{parseFloat(assetForm.cost || 0).toLocaleString()} {currency}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block mb-0.5">إضافات وتطوير رأسمالي:</span>
                          <span className="font-mono text-xs font-bold text-slate-900">{parseFloat(assetForm.capitalExp || 0).toLocaleString()} {currency}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block mb-0.5">مجمع الاستهلاك المتراكم:</span>
                          <span className="font-mono text-xs font-bold text-rose-700">-{parseFloat(assetForm.accDep || 0).toLocaleString()} {currency}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block mb-0.5">صافي القيمة الدفترية الحالية:</span>
                          <span className="font-mono text-xs font-black text-emerald-700">{(parseFloat(assetForm.cost || 0) + parseFloat(assetForm.capitalExp || 0) - parseFloat(assetForm.accDep || 0)).toLocaleString()} {currency}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operations Toolbar */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
                    {/* Primary actions */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleNewAsset}
                        disabled={!fixedAssetWritesAvailable}
                        className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{fixedAssetWritesAvailable ? 'جديد (F2)' : 'جديد — قراءة فقط'}</span>
                      </button>

                      {!isNewAssetMode ? (
                        <button
                          type="button"
                          onClick={() => {
                            const asset = fixedAssets.find(a => a.id === (typeof selectedAssetId === 'string' ? selectedAssetId : assetForm.id));
                            if (asset) {
                              setAssetForm({ ...asset });
                              setIsEditAssetMode(true);
                              setIsNewAssetMode(false);
                            }
                          }}
                          disabled={!fixedAssetWritesAvailable || assetForm.status === 'تم بيعه' || assetForm.status === 'مستبعد'}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSaveAsset}
                          disabled={!fixedAssetWritesAvailable}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>حفظ الأصل (F10)</span>
                        </button>
                      )}

                      {isNewAssetMode && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditAssetMode(false);
                            setIsNewAssetMode(false);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-2 rounded-lg cursor-pointer"
                        >
                          إلغاء التعديل
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteAsset(assetForm.id)}
                          disabled={!fixedAssetWritesAvailable || !assetForm.id}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-150 font-bold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>

                    {/* Secondary Operations Dropdown */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Document Utility Prints */}
                      <button
                        type="button"
                        onClick={() => handlePrintAssetCard(assetForm.id)}
                        disabled={!assetForm.id}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-2.5 py-2 rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="طباعة بطاقة الأصل والترميز الرقمي"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>بطاقة الأصل</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePrintDepreciationSchedule(assetForm.id)}
                        disabled={!assetForm.id}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-2.5 py-2 rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="عرض وطباعة جدول وخطة الاستهلاك السنوية المقدرة"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>خطة الإهلاك</span>
                      </button>

                      {/* Dropdown triggers for business operations */}
                      <div className="h-6 w-px bg-slate-200 mx-1"></div>

                      <select
                        onChange={(e) => {
                          const action = e.target.value;
                          if (action === 'depreciate') {
                            void handlePostAssetDepreciation(assetForm.id);
                          } else if (action === 'recalculate') {
                            void handleRecalculateAssetDepreciation(assetForm.id);
                          } else if (action === 'maintenance') {
                            setMaintenanceForm({
                              type: 'دورية',
                              cost: '',
                              supplier: assetForm.supplier || '',
                              date: new Date().toISOString().split('T')[0],
                              nextDate: new Date(Date.now() + 180*24*60*60*1000).toISOString().split('T')[0],
                              statusAfter: 'ممتاز',
                              notes: ''
                            });
                            setAssetActionModal('maintenance');
                          } else if (action === 'transfer') {
                            setTransferForm({
                              fromDept: assetForm.location || '',
                              toDept: '',
                              fromBranch: assetForm.branch || '',
                              toBranch: assetForm.branch || '',
                              fromResponsible: assetForm.responsible || '',
                              toResponsible: '',
                              date: new Date().toISOString().split('T')[0],
                              notes: ''
                            });
                            setAssetActionModal('transfer');
                          } else if (action === 'sell') {
                            setSaleForm({
                              price: '',
                              buyer: '',
                              date: new Date().toISOString().split('T')[0],
                              notes: ''
                            });
                            setAssetActionModal('sale');
                          } else if (action === 'discard') {
                            setDiscardForm({
                              date: new Date().toISOString().split('T')[0],
                              notes: '',
                              lossAccount: '5270'
                            });
                            setAssetActionModal('discard');
                          }
                          e.target.value = ''; // Reset select
                        }}
                        disabled={!assetForm.id || assetForm.status === 'تم بيعه' || assetForm.status === 'مستبعد'}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-extrabold px-3 py-2 rounded-lg border border-indigo-200 focus:outline-none cursor-pointer disabled:opacity-50 text-xs"
                      >
                        <option value="">⚙️ العمليات المحاسبية والإدارية للأصل...</option>
                        <option value="recalculate">🧮 إعادة احتساب الاستهلاك المتراكم المالي</option>
                        <option value="depreciate">⚡ قيد وترحيل قسط الإهلاك السنوي للدفتر اليومي</option>
                        <option value="maintenance">🔧 قيد وتسجيل أعمال صيانة ومصاريف ترميم</option>
                        <option value="transfer">🚚 نقل الأصل وتعديل العهدة والموقع المالي</option>
                        <option value="sell">💰 بيع الأصل وإصدار سند قبض وإثبات الإيراد الرأسمالي</option>
                        <option value="discard">❌ استبعاد وتكهين الأصل وشطب القيمة (خسائر رأسمالية)</option>
                      </select>
                    </div>
                  </div>

                  {/* Core Detailed Tabs Navigation Panel */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Tab Buttons */}
                    <div className="bg-slate-50 border-b border-slate-200 flex flex-wrap">
                      {[
                        { id: 'basic', label: 'البيانات الأساسية', icon: Building2 },
                        { id: 'financial', label: 'البيانات المالية', icon: DollarSign },
                        { id: 'depreciation', label: 'حسابات الإهلاك والقيمة', icon: TrendingUp },
                        { id: 'maintenance', label: 'صيانة ومصاريف', icon: Wrench },
                        { id: 'transfers', label: 'الحركة والعهد', icon: MapPin },
                        { id: 'attachments', label: 'المرفقات والعقود', icon: Paperclip },
                        { id: 'operations', label: 'سجل العمليات (Audit)', icon: HistoryIcon }
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const isTabActive = activeAssetTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveAssetTab(tab.id as any)}
                            className={`px-4 py-3 font-bold text-xs flex items-center gap-1.5 transition-colors duration-150 cursor-pointer border-b-2 ${
                              isTabActive
                                ? 'border-indigo-600 bg-white text-indigo-700'
                                : 'border-transparent text-slate-600 hover:bg-slate-100/50 hover:text-slate-900'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Tab Content Display */}
                    <div className="p-6">
                      
                      {/* TAB 1: BASIC INFO */}
                      {activeAssetTab === 'basic' && (
                        <div className="space-y-4 animate-fade-in text-xs text-slate-800">
                          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2 mb-4">البيانات التعريفية والبطاقة الفنية</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-slate-500 font-bold mb-1">رقم تعريف الأصل (تلقائي):</label>
                              <input
                                type="text"
                                readOnly
                                value={assetForm.id}
                                className="w-full bg-slate-100 border border-slate-250 rounded-lg p-2.5 font-bold font-mono text-slate-700 text-center"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-bold mb-1">كود تتبع الباركود والمطابقة:</label>
                              <input
                                type="text"
                              disabled={!isEditAssetMode}
                                value={assetForm.code}
                                onChange={(e) => setAssetForm({ ...assetForm, code: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold font-mono text-left disabled:bg-slate-100 disabled:text-slate-600"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-bold mb-1">تصنيف الأصول الرئيسي:</label>
                              <select
                              disabled={!isEditAssetMode}
                                value={assetForm.category}
                                onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold disabled:bg-slate-100"
                              >
                                <option value="سيارات وحافلات">سيارات وحافلات</option>
                                <option value="أجهزة ومعدات مختبرية">أجهزة ومعدات مختبرية</option>
                                <option value="أثاث وتجهيزات مدرسية">أثاث وتجهيزات مدرسية</option>
                                <option value="أجهزة ومولدات طاقة">أجهزة ومولدات طاقة</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-slate-700 font-bold mb-1">اسم الأصل الثابت التفصيلي:</label>
                              <input
                                type="text"
                              disabled={!isEditAssetMode}
                                value={assetForm.name}
                                onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                                placeholder="مثال: أوتوبيس نقل طلاب 30 راكب موديل 2024"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold disabled:bg-slate-100"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-bold mb-1">المجموعة الفرعية والنوع:</label>
                              <input
                                type="text"
                              disabled={!isEditAssetMode}
                                value={assetForm.group}
                                onChange={(e) => setAssetForm({ ...assetForm, group: e.target.value })}
                                placeholder="مثال: وسائل نقل الطلبة والطواقم"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold disabled:bg-slate-100"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-slate-700 font-bold mb-1">الشركة المصنعة (Brand):</label>
                              <input
                                type="text"
                              disabled={!isEditAssetMode}
                                value={assetForm.manufacturer}
                                onChange={(e) => setAssetForm({ ...assetForm, manufacturer: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold disabled:bg-slate-100"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-bold mb-1">الموديل (Model):</label>
                              <input
                                type="text"
                              disabled={!isEditAssetMode}
                                value={assetForm.model}
                                onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold disabled:bg-slate-100"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-bold mb-1">الرقم التسلسلي المصنعي (Serial):</label>
                              <input
                                type="text"
                              disabled={!isEditAssetMode}
                                value={assetForm.serialNo}
                                onChange={(e) => setAssetForm({ ...assetForm, serialNo: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold font-mono text-left disabled:bg-slate-100"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                            <div>
                              <label className="block text-slate-700 font-bold mb-1">الفرع الموطن:</label>
                              <input
                                type="text"
                              disabled={!isEditAssetMode}
                                value={assetForm.branch}
                                onChange={(e) => setAssetForm({ ...assetForm, branch: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold disabled:bg-slate-100"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-bold mb-1">موقع التواجد الفعلي:</label>
                              <input
                                type="text"
                              disabled={!isEditAssetMode}
                                value={assetForm.location}
                                onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
                                placeholder="مثال: المبنى الدراسي الرئيسي - قاعة الاجتماعات"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold disabled:bg-slate-100"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-bold mb-1">الموظف المسؤول (حامل العهدة):</label>
                              <input
                                type="text"
                              disabled={!isEditAssetMode}
                                value={assetForm.responsible}
                                onChange={(e) => setAssetForm({ ...assetForm, responsible: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold disabled:bg-slate-100"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: FINANCIAL INFO */}
                      {activeAssetTab === 'financial' && (
                        <div className="space-y-4 animate-fade-in text-xs text-slate-800">
                          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2 mb-4">البيانات المالية والرسملة وتاريخ التملك</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-slate-700 font-bold mb-1">تكلفة الشراء التاريخية (Cost):</label>
                              <input
                                type="number"
                              disabled={!isEditAssetMode}
                                value={assetForm.cost}
                                onChange={(e) => setAssetForm({ ...assetForm, cost: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold font-mono focus:outline-none text-indigo-700 disabled:bg-slate-100"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-bold mb-1">إضافات وتطوير رأسمالي (Capital Exp):</label>
                              <input
                                type="number"
                              disabled={!isEditAssetMode}
                                value={assetForm.capitalExp}
                                onChange={(e) => setAssetForm({ ...assetForm, capitalExp: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold font-mono focus:outline-none disabled:bg-slate-100"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-bold mb-1">القيمة كخردة مستردة (Scrap Value):</label>
                              <input
                                type="number"
                              disabled={!isEditAssetMode}
                                value={assetForm.scrapValue}
                                onChange={(e) => setAssetForm({ ...assetForm, scrapValue: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold font-mono focus:outline-none disabled:bg-slate-100"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-slate-700 font-bold mb-1">تاريخ الشراء الأساسي:</label>
                              <input
                                type="date"
                                disabled={!isEditAssetMode}
                                value={assetForm.purchaseDate}
                                onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold disabled:bg-slate-100"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-bold mb-1">المورد البائع:</label>
                              <input
                                type="text"
                                disabled={!isEditAssetMode}
                                value={assetForm.supplier}
                                onChange={(e) => setAssetForm({ ...assetForm, supplier: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold disabled:bg-slate-100"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-bold mb-1">رقم الفاتورة المرجعي:</label>
                              <input
                                type="text"
                                disabled={!isEditAssetMode}
                                value={assetForm.invoiceNo}
                                onChange={(e) => setAssetForm({ ...assetForm, invoiceNo: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold disabled:bg-slate-100 font-mono text-left"
                              />
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-100">
                            <h4 className="font-extrabold text-slate-800 mb-3 text-xs">حسابات شجرة الحسابات العامة المرتبطة (الأستاذ العام)</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
                              <div>
                                <label className="block text-slate-500 font-bold mb-1">حساب الأصل الرئيسي (مدين):</label>
                                <select
                                  disabled={!isEditAssetMode}
                                  value={assetForm.assetAccount}
                                  onChange={(e) => setAssetForm({ ...assetForm, assetAccount: e.target.value })}
                                  className="w-full bg-slate-50 border border-slate-200 p-2 font-bold rounded-lg disabled:bg-slate-100"
                                >
                                  <option value="1300">1300 - الأصول الثابتة والإنشاءات</option>
                                  <option value="1301">1301 - تجهيزات ومعدات فنية</option>
                                  <option value="1302">1302 - حافلات وسيارات</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-slate-500 font-bold mb-1">حساب مجمع الإهلاك (دائن):</label>
                                <select
                                  disabled={!isEditAssetMode}
                                  value={assetForm.accDepAccount}
                                  onChange={(e) => setAssetForm({ ...assetForm, accDepAccount: e.target.value })}
                                  className="w-full bg-slate-50 border border-slate-200 p-2 font-bold rounded-lg disabled:bg-slate-100"
                                >
                                  <option value="1300">1300 - حساب مجمع الإهلاك (أصول دائنة)</option>
                                  <option value="1303">1303 - مجمع إهلاك أصول مخصص</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-slate-500 font-bold mb-1">حساب مصروف إهلاك الأصول:</label>
                                <select
                                  disabled={!isEditAssetMode}
                                  value={assetForm.depExpenseAccount}
                                  onChange={(e) => setAssetForm({ ...assetForm, depExpenseAccount: e.target.value })}
                                  className="w-full bg-slate-50 border border-slate-200 p-2 font-bold rounded-lg disabled:bg-slate-100"
                                >
                                  <option value="5230">5230 - مصاريف الصيانة والترميمات الفنية</option>
                                  <option value="5280">5280 - مصروف استهلاك وإهلاك الأصول</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 3: DEPRECIATION CALCULATOR */}
                      {activeAssetTab === 'depreciation' && (
                        <div className="space-y-6 animate-fade-in text-xs text-slate-800">
                          <div className="border-b border-slate-100 pb-3">
                            <h3 className="font-extrabold text-slate-900 text-sm">محاسبة الاستهلاك والإهلاك وجدولة القيمة</h3>
                            <p className="text-[11px] text-slate-500 mt-1">يحتسب الاستهلاك تلقائياً وفق معادلات قسط الاستهلاك السنوي الموحد</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-center">
                              <span className="text-[10px] text-slate-500 block mb-0.5">العمر الإنتاجي المقدر:</span>
                              <span className="font-black text-slate-900 font-mono text-sm">{assetForm.usefulLife} سنوات</span>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-center">
                              <span className="text-[10px] text-slate-500 block mb-0.5">معدل الاستهلاك السنوي:</span>
                              <span className="font-black text-indigo-700 font-mono text-sm">{assetForm.depRate}</span>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-center">
                              <span className="text-[10px] text-slate-500 block mb-0.5">طريقة الإهلاك:</span>
                              <span className="font-extrabold text-slate-900 text-sm">{assetForm.depMethod}</span>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-center">
                              <span className="text-[10px] text-slate-500 block mb-0.5">تاريخ بدء الاحتساب الفعلي:</span>
                              <span className="font-black text-slate-900 font-mono text-sm">{assetForm.depStartDate || assetForm.purchaseDate}</span>
                            </div>
                          </div>

                          {/* Dynamic Calculator Visualizer */}
                          <div className="bg-indigo-50/40 border border-indigo-150 rounded-xl p-4 space-y-3">
                            <h4 className="font-black text-indigo-900 text-xs flex items-center gap-1">
                              <Calculator className="w-4 h-4 text-indigo-600" />
                              <span>محاكاة المعادلة الرياضية لقسط الاستهلاك السنوي:</span>
                            </h4>

                            <div className="bg-white rounded-lg p-3 font-mono text-center text-[13px] border border-indigo-100 flex flex-wrap items-center justify-center gap-1 select-none">
                              <span>قسط الإهلاك = (</span>
                              <span className="font-black text-slate-800">التكلفة ({parseFloat(assetForm.cost || 0).toLocaleString()})</span>
                              <span>+</span>
                              <span className="font-bold text-slate-600">إضافات ({parseFloat(assetForm.capitalExp || 0).toLocaleString()})</span>
                              <span>-</span>
                              <span className="font-bold text-rose-500">الخردة ({parseFloat(assetForm.scrapValue || 0).toLocaleString()})</span>
                              <span>) /</span>
                              <span className="font-black text-indigo-700">العمر ({assetForm.usefulLife} سنوات)</span>
                              <span>=</span>
                              <span className="bg-indigo-600 text-white font-extrabold px-2 py-0.5 rounded leading-none text-xs">
                                {(((parseFloat(assetForm.cost || 0) + parseFloat(assetForm.capitalExp || 0) - parseFloat(assetForm.scrapValue || 0)) / (parseInt(assetForm.usefulLife) || 5)).toFixed(2)).toLocaleString()} د.ل / سنوياً
                              </span>
                            </div>
                          </div>

                          {/* Simulated Depreciation Schedule Table */}
                          <div className="space-y-2">
                            <h4 className="font-extrabold text-slate-900 text-xs">الجدول المقدر والاهتلاك الزمني للأصل</h4>
                            
                            <div className="border border-slate-200 rounded-lg overflow-hidden font-mono text-[10px]">
                              <table className="w-full text-right border-collapse">
                                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                  <tr>
                                    <th className="px-3 py-2 text-center">السنة المبرمجة</th>
                                    <th className="px-3 py-2 text-center">القيمة القابلة للإهلاك</th>
                                    <th className="px-3 py-2 text-center">مصروف الإهلاك السنوي</th>
                                    <th className="px-3 py-2 text-center">مجمع الاستهلاك التراكمي</th>
                                    <th className="px-3 py-2 text-left">صافي القيمة المتبقية نهاية العام</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                  {Array.from({ length: Math.min(10, parseInt(assetForm.usefulLife) || 5) }).map((_, i) => {
                                    const costVal = parseFloat(assetForm.cost || 0) + parseFloat(assetForm.capitalExp || 0);
                                    const depVal = costVal - parseFloat(assetForm.scrapValue || 0);
                                    const lifeVal = parseInt(assetForm.usefulLife) || 5;
                                    const annualDep = depVal / lifeVal;
                                    const currentAccDep = annualDep * (i + 1);
                                    const currentNetVal = costVal - currentAccDep;

                                    return (
                                      <tr key={i} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 text-center font-bold text-slate-900">السنة {i + 1} ({new Date(assetForm.purchaseDate).getFullYear() + i})</td>
                                        <td className="px-3 py-2 text-center">{(costVal).toLocaleString()} د.ل</td>
                                        <td className="px-3 py-2 text-center text-rose-600">{(annualDep).toLocaleString()} د.ل</td>
                                        <td className="px-3 py-2 text-center text-rose-600">{(currentAccDep).toLocaleString()} د.ل</td>
                                        <td className="px-3 py-2 text-left font-black text-emerald-700">{(Math.max(parseFloat(assetForm.scrapValue || 0), currentNetVal)).toLocaleString()} د.ل</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 4: MAINTENANCE LOGS */}
                      {activeAssetTab === 'maintenance' && (
                        <div className="space-y-4 animate-fade-in text-xs text-slate-800">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-2">
                            <div>
                              <h3 className="font-extrabold text-slate-900 text-sm">أعمال الصيانة الوقائية والطارئة والرسملة</h3>
                              <p className="text-[11px] text-slate-500 mt-1">تتبع التكاليف التشغيلية للمحافظة على جاهزية الأصل التشغيلية</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setMaintenanceForm({
                                  type: 'دورية',
                                  cost: '',
                                  supplier: '',
                                  date: new Date().toISOString().split('T')[0],
                                  nextDate: new Date(Date.now() + 180*24*60*60*1000).toISOString().split('T')[0],
                                  statusAfter: 'ممتاز',
                                  notes: ''
                                });
                                setAssetActionModal('maintenance');
                              }}
                              className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold p-2 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>تسجيل صيانة جديدة</span>
                            </button>
                          </div>

                          <div className="space-y-3">
                            {(assetForm.maintenanceLogs || []).map((m: any) => (
                              <div key={m.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-bold text-[9px] font-sans">
                                      صيانة {m.type}
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-400 font-extrabold">{m.id}</span>
                                    <span className="text-slate-300">|</span>
                                    <span className="font-extrabold text-slate-700">{m.date}</span>
                                  </div>
                                  <p className="font-extrabold text-slate-900 text-xs mt-1 leading-relaxed">المورد: {m.supplier}</p>
                                  <p className="text-slate-600 mt-0.5 leading-relaxed">{m.notes}</p>
                                </div>

                                <div className="text-left space-y-1 self-end md:self-start">
                                  <span className="text-[10px] text-slate-400 block">تكلفة أعمال الصيانة:</span>
                                  <span className="font-mono font-black text-indigo-700 text-sm" dir="ltr">{(m.cost).toLocaleString()} {currency}</span>
                                  <span className="text-[9px] text-slate-400 block">تاريخ الفحص القادم: {m.nextDate}</span>
                                </div>
                              </div>
                            ))}

                            {(!assetForm.maintenanceLogs || assetForm.maintenanceLogs.length === 0) && (
                              <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <span className="text-slate-400 font-bold block mb-1">لا توجد أعمال صيانة وقيد مسجلة للأصل حالياً.</span>
                                <span className="text-[10px] text-slate-400">سجل عمليات الصيانة لمتابعة تكلفتها ومواعيد فحص العهدة.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* TAB 5: TRANSFER & RECEIPT MOVEMENT */}
                      {activeAssetTab === 'transfers' && (
                        <div className="space-y-4 animate-fade-in text-xs text-slate-800">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-2">
                            <div>
                              <h3 className="font-extrabold text-slate-900 text-sm">سجل انتقال حركة العهد ومواقع الاستخدام</h3>
                              <p className="text-[11px] text-slate-500 mt-1">تتبع خط حركة العهدة الإدارية والمقر الفرعي للأصل بين الأقسام</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setTransferForm({
                                  fromDept: assetForm.location || '',
                                  toDept: '',
                                  fromBranch: assetForm.branch || '',
                                  toBranch: assetForm.branch || '',
                                  fromResponsible: assetForm.responsible || '',
                                  toResponsible: '',
                                  date: new Date().toISOString().split('T')[0],
                                  notes: ''
                                });
                                setAssetActionModal('transfer');
                              }}
                              className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold p-2 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>نقل وتعديل عهدة الأصل</span>
                            </button>
                          </div>

                          <div className="space-y-3">
                            {(assetForm.transferLogs || []).map((t: any) => (
                              <div key={t.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-[9px]">حركة منقولة</span>
                                    <span className="font-mono text-[10px] text-indigo-600 font-extrabold">{t.id}</span>
                                    <span className="text-slate-300">|</span>
                                    <span className="font-extrabold text-slate-700">{t.date}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-white p-2.5 rounded-lg border border-slate-100 space-y-1">
                                    <span className="text-[9px] text-slate-400 block font-bold">من (الجهة والعهدة السابقة):</span>
                                    <div className="font-extrabold text-slate-900">{t.fromBranch} - {t.fromDept}</div>
                                    <div className="text-[10px] text-slate-500">العهدة: {t.fromResponsible}</div>
                                  </div>

                                  <div className="bg-white p-2.5 rounded-lg border border-slate-100 space-y-1">
                                    <span className="text-[9px] text-slate-400 block font-bold">إلى (الجهة والعهدة الجديدة):</span>
                                    <div className="font-extrabold text-slate-900 text-indigo-700">{t.toBranch} - {t.toDept}</div>
                                    <div className="text-[10px] text-indigo-700 font-black">العهدة: {t.toResponsible}</div>
                                  </div>
                                </div>

                                {t.notes && (
                                  <p className="text-slate-500 bg-white p-2 rounded-lg border border-slate-100 italic leading-relaxed text-[11px]">
                                    شرح تبرير الحركة: {t.notes}
                                  </p>
                                )}
                              </div>
                            ))}

                            {(!assetForm.transferLogs || assetForm.transferLogs.length === 0) && (
                              <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <span className="text-slate-400 font-bold block mb-1">لا توجد عمليات حركة سابقة للأصل.</span>
                                <span className="text-[10px] text-slate-400">سيتم حفظ تاريخ تغير مواقع الأصل وحاملي العهدة تلقائياً هنا في السجل التاريخي للأصل.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* TAB 6: ATTACHMENTS & CONTRACTS */}
                      {activeAssetTab === 'attachments' && (
                        <div className="space-y-4 animate-fade-in text-xs text-slate-800">
                          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2 mb-4">وثائق إثبات الملكية والمرفقات وعقود الصيانة</h3>

                          {/* Documents checklist */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Checklist cards */}
                            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                              <span className="font-extrabold text-slate-900 text-xs block">مراجعة المستندات المطلوبة (Checklist):</span>
                              
                              <div className="space-y-2 text-[11px]">
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer" />
                                  <span className="text-slate-700 font-extrabold">فاتورة الشراء الرسمية المعتمدة</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer" />
                                  <span className="text-slate-700 font-extrabold">كتالوج الاستخدام وشهادة الضمان الفني</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer" />
                                  <span className="text-slate-500">عقد صيانة دورية مفعل</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer" />
                                  <span className="text-slate-500">محضر تسليم واستلام العهدة الموقعة للعهد الشخصية</span>
                                </div>
                              </div>
                            </div>

                            {/* Drop zone mockup */}
                            <div className="border border-dashed border-indigo-200 bg-indigo-50/10 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50/35 transition">
                              <span className="text-3xl block mb-2">📁</span>
                              <span className="font-black text-indigo-800 text-xs">اسحب وأفلت ملفات المرفقات هنا</span>
                              <span className="text-[10px] text-slate-400 mt-1">امتدادات مدعومة: PDF, PNG, JPG, XLSX بحد أقصى 10MB</span>
                            </div>
                          </div>

                          {/* List of uploaded files */}
                          <div className="space-y-2 pt-3">
                            <span className="font-extrabold text-slate-900 block text-xs">الملفات والمرفقات الحالية للأصل:</span>
                            
                            {(assetForm.attachments || []).map((file: any) => (
                              <div key={file.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">📄</span>
                                  <div>
                                    <span className="font-bold text-slate-800 text-xs block">{file.name}</span>
                                    <span className="text-[9px] text-slate-400 font-mono">{file.type} | الحجم: {file.size}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => triggerNotification(`📥 جاري تحميل المستند: ${file.name}...`, 'success')}
                                  className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline flex items-center gap-0.5"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>تنزيل المرفق</span>
                                </button>
                              </div>
                            ))}

                            {(!assetForm.attachments || assetForm.attachments.length === 0) && (
                              <div className="text-center p-4 text-slate-400 font-bold bg-slate-50 border border-dashed rounded-lg">
                                لم يتم رفع مستندات لهذا الأصل بعد.
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* TAB 7: OPERATIONS AUDIT TRAIL */}
                      {activeAssetTab === 'operations' && (
                        <div className="space-y-4 animate-fade-in text-xs text-slate-800">
                          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2 mb-4">سجل العمليات والرقابة والتحقق من التغييرات (Audit Trail)</h3>

                          <div className="relative border-r-2 border-indigo-200 pr-5 mr-3 space-y-5 py-2">
                            {(assetForm.operations || []).map((op: any, index: number) => (
                              <div key={index} className="relative space-y-1">
                                {/* Bullet on timeline */}
                                <div className="absolute right-[-26px] top-1 bg-indigo-600 text-white rounded-full w-3.5 h-3.5 border-2 border-white flex items-center justify-center text-[8px] font-mono">
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="bg-indigo-50 text-indigo-800 px-2 py-0.2 rounded font-extrabold text-[9px]">
                                    {op.type}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400">{op.date}</span>
                                  <span className="text-slate-300">|</span>
                                  <span className="font-extrabold text-slate-700">المستخدم: {op.username}</span>
                                </div>
                                <p className="text-slate-600 font-medium leading-relaxed max-w-2xl mt-1">
                                  {op.details}
                                </p>
                              </div>
                            ))}

                            {(!assetForm.operations || assetForm.operations.length === 0) && (
                              <div className="text-center p-4 text-slate-400 font-bold">
                                لا يوجد سجل حركات مدون للأصل حالياً.
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* VIEW B: FIXED ASSETS ANALYTICS & REPORTS SUITE */}
            {fixedAssetViewMode === 'reports' && (
              <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                
                {/* Reports Header and Selector */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                  <div className="space-y-1">
                    <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                      <Barcode className="w-5 h-5 text-indigo-600" />
                      <span>سجل التقارير المالية والتحليلية الشاملة للأصول</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      اختر نموذج التقرير المطلوب لاستعراضه والمطابقة المحاسبية والطباعة المباشرة مع تصدير البيانات الشاملة
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="font-black text-slate-800 text-xs">نموذج التقرير:</label>
                    <select
                      value={fixedAssetReportType}
                      onChange={(e) => {
                        setFixedAssetReportType(e.target.value);
                        setActiveAssetTab(e.target.value);
                      }}
                      className="bg-slate-100 border border-slate-200 p-2 px-3 font-bold rounded-lg focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="all_assets">📋 سجل وجرد الأصول الثابتة الشامل</option>
                      <option value="depreciation">🧮 تقرير ومخطط استهلاك الأصول السنوي</option>
                      <option value="acc_dep">📉 تقرير مجمع الاستهلاك وصافي القيمة الدفترية</option>
                      <option value="category">🏷️ تقرير توزيع وإحصاء الأصول حسب التصنيف</option>
                      <option value="location">📍 تقرير جرد الأصول حسب موقع التواجد الفعلي</option>
                      <option value="cost_center">🏫 تقرير توزيع تكلفة الأصول على مراكز التكلفة</option>
                      <option value="maintenance">🔧 تقرير وتكاليف أعمال الصيانة والترميم الإجمالية</option>
                      <option value="discarded_sold">❌ كشف الأصول الثابتة المستبعدة والمباعة</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        // Gather report headers and rows dynamic extraction
                        let headers: string[] = [];
                        let rows: any[][] = [];
                        let reportTitle = '';

                        if (fixedAssetReportType === 'all_assets') {
                          reportTitle = 'سجل_الأصول_الثابتة_الشامل';
                          headers = ['رقم الأصل', 'اسم الأصل', 'الكود', 'التصنيف', 'تاريخ الشراء', 'التكلفة التاريخية', 'الحالة'];
                          rows = fixedAssets.map(a => [a.id, a.name, a.code, a.category, a.purchaseDate, a.cost, a.status]);
                        } else if (fixedAssetReportType === 'depreciation') {
                          reportTitle = 'تقرير_استهلاك_الأصول_السنوي';
                          headers = ['رقم الأصل', 'الأصل', 'التصنيف', 'العمر المقدر', 'معدل الاستهلاك', 'القسط السنوي المقدر'];
                          rows = fixedAssets.map(a => [a.id, a.name, a.category, `${a.usefulLife} سنوات`, a.depRate, ((a.cost + a.capitalExp - a.scrapValue)/a.usefulLife).toFixed(2)]);
                        } else if (fixedAssetReportType === 'acc_dep') {
                          reportTitle = 'كشف_مجمع_الإهلاك_والقيمة_الدفترية';
                          headers = ['رقم الأصل', 'الأصل', 'التكلفة التاريخية', 'مجمع الإهلاك الكلي', 'صافي القيمة الدفترية'];
                          rows = fixedAssets.map(a => [a.id, a.name, a.cost, a.accDep, a.netValue]);
                        } else if (fixedAssetReportType === 'category') {
                          reportTitle = 'الأصول_حسب_التصنيف_الرئيسي';
                          headers = ['التصنيف', 'عدد الأصول الموطنة', 'إجمالي التكلفة التاريخية', 'صافي القيمة الدفترية'];
                          // Simple dynamic group calculations
                          const groups: any = {};
                          fixedAssets.forEach(a => {
                            if (!groups[a.category]) groups[a.category] = { count: 0, cost: 0, net: 0 };
                            groups[a.category].count += 1;
                            groups[a.category].cost += a.cost;
                            groups[a.category].net += a.netValue;
                          });
                          headers = ['التصنيف الرئيسي', 'عدد الأصول', 'إجمالي التكلفة', 'إجمالي القيمة الدفترية'];
                          rows = Object.keys(groups).map(k => [k, groups[k].count, groups[k].cost, groups[k].net]);
                        } else if (fixedAssetReportType === 'location') {
                          reportTitle = 'جرد_الأصول_حسب_المقر_والمسؤول';
                          headers = ['رقم الأصل', 'اسم الأصل', 'الفرع المالي', 'موقع التواجد الفعلي', 'حامل العهدة الشخصية'];
                          rows = fixedAssets.map(a => [a.id, a.name, a.branch, a.location, a.responsible]);
                        } else if (fixedAssetReportType === 'cost_center') {
                          reportTitle = 'توزيع_تكلفة_الأصول_على_مراكز_التكلفة';
                          headers = ['مركز التكلفة المالي', 'عدد الأصول', 'التكلفة الكلية', 'القيمة الدفترية'];
                          const centers: any = {
                            primary: { name: 'المرحلة الابتدائية', count: 0, cost: 0, net: 0 },
                            secondary: { name: 'المرحلة الثانوية', count: 0, cost: 0, net: 0 },
                            kindergarten: { name: 'الروضة النموذجية', count: 0, cost: 0, net: 0 },
                            middle: { name: 'المرحلة الإعدادية', count: 0, cost: 0, net: 0 },
                            all: { name: 'الإدارة العامة والموحد', count: 0, cost: 0, net: 0 }
                          };
                          fixedAssets.forEach(a => {
                            const cc = a.costCenter || 'all';
                            if (centers[cc]) {
                              centers[cc].count += 1;
                              centers[cc].cost += a.cost;
                              centers[cc].net += a.netValue;
                            }
                          });
                          rows = Object.keys(centers).map(k => [centers[k].name, centers[k].count, centers[k].cost, centers[k].net]);
                        } else if (fixedAssetReportType === 'maintenance') {
                          reportTitle = 'تقرير_تكاليف_أعمال_الصيانة';
                          headers = ['الأصل الثابت المعني', 'كود الصيانة', 'نوع الصيانة', 'تاريخ الصيانة', 'المورد الفني', 'تكلفة الصيانة د.ل', 'البيان وملاحظات الإصلاح'];
                          fixedAssets.forEach(a => {
                            (a.maintenanceLogs || []).forEach((m: any) => {
                              rows.push([a.name, m.id, `صيانة ${m.type}`, m.date, m.supplier, m.cost, m.notes]);
                            });
                          });
                        } else if (fixedAssetReportType === 'discarded_sold') {
                          reportTitle = 'كشف_الأصول_المستبعدة_والمباعة';
                          headers = ['رقم الأصل', 'اسم الأصل', 'التكلفة التاريخية', 'مجمع الإهلاك قبل العملية', 'الحالة النهائية للأصل'];
                          rows = fixedAssets.filter(a => a.status === 'تم بيعه' || a.status === 'مستبعد')
                        fixedAssets.map(a => [a.id, a.name, a.cost, a.accDep, a.status]);
                        }

                        exportReportExcel(reportTitle, headers, rows);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2 px-3 rounded-lg flex items-center gap-1 cursor-pointer text-xs"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>تصدير Excel</span>
                    </button>
                  </div>
                </div>

                {/* Report Table Display Panel */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  
                  {/* ALL ASSETS REGISTER */}
                  {activeAssetTab === 'all_assets' && (
                    <table className="w-full text-right border-collapse text-[11px]">
                      <thead className="bg-slate-800 text-slate-100 font-bold border-b border-slate-200 h-9">
                        <tr>
                          <th className="px-4">رقم الأصل</th>
                          <th className="px-4">كود الأصل</th>
                          <th className="px-4">اسم الأصل الثابت وتفاصيله</th>
                          <th className="px-4">التصنيف</th>
                          <th className="px-4 text-center">تاريخ التملك والشراء</th>
                          <th className="px-4 text-center">التكلفة التاريخية</th>
                          <th className="px-4 text-center">مجمع الإهلاك</th>
                          <th className="px-4 text-left">القيمة الدفترية</th>
                          <th className="px-4 text-center">حالة الأصل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                        {fixedAssets.map(fa => (
                          <tr key={fa.id} className="h-9 hover:bg-slate-50">
                            <td className="px-4 font-mono font-bold text-slate-600">{fa.id}</td>
                            <td className="px-4 font-mono font-bold text-slate-500">{fa.code}</td>
                            <td className="px-4 font-extrabold text-[#020817]">{fa.name}</td>
                            <td className="px-4 font-bold text-slate-600">{fa.category}</td>
                            <td className="px-4 text-center font-mono text-slate-500">{fa.purchaseDate}</td>
                            <td className="px-4 text-center font-mono">{fa.cost.toLocaleString()} د.ل</td>
                            <td className="px-4 text-center font-mono text-rose-500">-{fa.accDep.toLocaleString()} د.ل</td>
                            <td className="px-4 text-left font-mono font-black text-emerald-700">{fa.netValue.toLocaleString()} د.ل</td>
                            <td className="px-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                                fa.status === 'نشط / قيد التشغيل' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                                fa.status === 'تم بيعه' ? 'bg-blue-50 text-blue-800 border-blue-100' :
                                'bg-rose-50 text-rose-800 border-rose-100'
                              }`}>
                                {fa.status === 'نشط / قيد التشغيل' ? 'نشط' : fa.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* DEPRECIATION ESTIMATED SCHEDULE */}
                  {activeAssetTab === 'depreciation' && (
                    <table className="w-full text-right border-collapse text-[11px]">
                      <thead className="bg-slate-800 text-slate-100 font-bold border-b border-slate-200 h-9">
                        <tr>
                          <th className="px-4">كود الأصل</th>
                          <th className="px-4">اسم الأصل الثابت</th>
                          <th className="px-4 text-center">التكلفة القابلة للإهلاك</th>
                          <th className="px-4 text-center">العمر الإنتاجي</th>
                          <th className="px-4 text-center">معدل الاستهلاك %</th>
                          <th className="px-4 text-center">قسط الاستهلاك السنوي المقدر</th>
                          <th className="px-4 text-center">قسط الاستهلاك الشهري المقدر</th>
                          <th className="px-4 text-left">قيمة الخردة المقدرة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                        {fixedAssets.map(fa => {
                          const depreciableAmount = fa.cost + fa.capitalExp - fa.scrapValue;
                          const annualDep = depreciableAmount / fa.usefulLife;
                          const monthlyDep = annualDep / 12;

                          return (
                            <tr key={fa.id} className="h-9 hover:bg-slate-50">
                              <td className="px-4 font-mono font-bold text-slate-500">{fa.code}</td>
                              <td className="px-4 font-extrabold text-slate-900">{fa.name}</td>
                              <td className="px-4 text-center font-mono">{depreciableAmount.toLocaleString()} د.ل</td>
                              <td className="px-4 text-center font-sans">{fa.usefulLife} سنوات</td>
                              <td className="px-4 text-center font-mono font-black text-indigo-700">{fa.depRate}</td>
                              <td className="px-4 text-center font-mono font-black text-rose-500">{(annualDep).toLocaleString()} د.ل</td>
                              <td className="px-4 text-center font-mono text-slate-500">{(monthlyDep).toLocaleString()} د.ل</td>
                              <td className="px-4 text-left font-mono font-bold text-slate-600">{fa.scrapValue.toLocaleString()} د.ل</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {/* ACCUMULATED DEPRECIATION COMPARISON */}
                  {activeAssetTab === 'acc_dep' && (
                    <table className="w-full text-right border-collapse text-[11px]">
                      <thead className="bg-slate-800 text-slate-100 font-bold border-b border-slate-200 h-9">
                        <tr>
                          <th className="px-4">رقم الأصل</th>
                          <th className="px-4">اسم الأصل الثابت</th>
                          <th className="px-4 text-center">التكلفة الإجمالية (Cost)</th>
                          <th className="px-4 text-center">مجمع الإهلاك التراكمي (AccDep)</th>
                          <th className="px-4 text-center">نسبة ما تم إهلاكه حتى الآن</th>
                          <th className="px-4 text-left">صافي القيمة الدفترية الحالية</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                        {fixedAssets.map(fa => {
                          const totalCost = fa.cost + fa.capitalExp;
                          const ratio = totalCost > 0 ? Math.round((fa.accDep / totalCost) * 100) : 0;

                          return (
                            <tr key={fa.id} className="h-9 hover:bg-slate-50">
                              <td className="px-4 font-mono font-bold text-slate-500">{fa.id}</td>
                              <td className="px-4 font-extrabold text-slate-900">{fa.name}</td>
                              <td className="px-4 text-center font-mono">{totalCost.toLocaleString()} د.ل</td>
                              <td className="px-4 text-center font-mono text-rose-600">-{fa.accDep.toLocaleString()} د.ل</td>
                              <td className="px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5 font-mono">
                                  <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-indigo-600 h-1.5" style={{ width: `${Math.min(100, ratio)}%` }}></div>
                                  </div>
                                  <span>{ratio}%</span>
                                </div>
                              </td>
                              <td className="px-4 text-left font-mono font-black text-emerald-700">{fa.netValue.toLocaleString()} د.ل</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {/* REPORT CATEGORIES GROUP SUMMARY */}
                  {activeAssetTab === 'category' && (
                    <table className="w-full text-right border-collapse text-[11px]">
                      <thead className="bg-slate-800 text-slate-100 font-bold border-b border-slate-200 h-9">
                        <tr>
                          <th className="px-4">التصنيف المحاسبي للأصل</th>
                          <th className="px-4 text-center">عدد الأصول المدرجة بالجرد</th>
                          <th className="px-4 text-center">إجمالي القيمة التاريخية</th>
                          <th className="px-4 text-center">إجمالي المجمعات المحتسبة</th>
                          <th className="px-4 text-left">صافي قيمة الأصول الدفترية الكلية</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                        {(() => {
                          const groups: any = {};
                          fixedAssets.forEach(a => {
                            if (!groups[a.category]) {
                              groups[a.category] = { count: 0, cost: 0, dep: 0, net: 0 };
                            }
                            groups[a.category].count += 1;
                            groups[a.category].cost += a.cost;
                            groups[a.category].dep += a.accDep;
                            groups[a.category].net += a.netValue;
                          });

                          return Object.keys(groups).map((key, idx) => (
                            <tr key={idx} className="h-9 hover:bg-slate-50">
                              <td className="px-4 font-black text-slate-900">{key}</td>
                              <td className="px-4 text-center font-sans font-extrabold text-indigo-700">{groups[key].count} أصل</td>
                              <td className="px-4 text-center font-mono">{(groups[key].cost).toLocaleString()} د.ل</td>
                              <td className="px-4 text-center font-mono text-rose-500">-{(groups[key].dep).toLocaleString()} د.ل</td>
                              <td className="px-4 text-left font-mono font-black text-emerald-700">{(groups[key].net).toLocaleString()} د.ل</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  )}

                  {/* REPORT: LOCATION & ASSIGNED RESPONSIBILITIES */}
                  {activeAssetTab === 'location' && (
                    <table className="w-full text-right border-collapse text-[11px]">
                      <thead className="bg-slate-800 text-slate-100 font-bold border-b border-slate-200 h-9">
                        <tr>
                          <th className="px-4">كود الأصل</th>
                          <th className="px-4">اسم الأصل الثابت المعني</th>
                          <th className="px-4">الفرع التنظيمي الموطن</th>
                          <th className="px-4">موقع الاستخدام الفعلي الفوري</th>
                          <th className="px-4">الموظف حامل العهدة (المسؤول)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                        {fixedAssets.map(fa => (
                          <tr key={fa.id} className="h-9 hover:bg-slate-50">
                            <td className="px-4 font-mono font-bold text-slate-500">{fa.code}</td>
                            <td className="px-4 font-black text-slate-900">{fa.name}</td>
                            <td className="px-4 font-extrabold text-slate-700">{fa.branch}</td>
                            <td className="px-4 text-slate-700">{fa.location || 'غير موثق بالمطابقة'}</td>
                            <td className="px-4 text-indigo-800 font-black">{fa.responsible || 'إدارة الخدمات والعهد'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* REPORT: COST CENTERS */}
                  {activeAssetTab === 'cost_center' && (
                    <table className="w-full text-right border-collapse text-[11px]">
                      <thead className="bg-slate-800 text-slate-100 font-bold border-b border-slate-200 h-9">
                        <tr>
                          <th className="px-4">مركز التكلفة المحاسبي (Cost Center)</th>
                          <th className="px-4 text-center">عدد الأصول المرتبطة</th>
                          <th className="px-4 text-center">إجمالي القيمة الإنشائية والأصول</th>
                          <th className="px-4 text-left">إجمالي القيمة الدفترية المتبقية للمركز</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                        {(() => {
                          const centers: any = {
                            primary: { name: 'المرحلة الابتدائية', count: 0, cost: 0, net: 0 },
                            secondary: { name: 'المرحلة الثانوية', count: 0, cost: 0, net: 0 },
                            kindergarten: { name: 'الروضة النموذجية', count: 0, cost: 0, net: 0 },
                            middle: { name: 'المرحلة الإعدادية', count: 0, cost: 0, net: 0 },
                            all: { name: 'المبنى الرئيسي والإدارة العامة والموحد', count: 0, cost: 0, net: 0 }
                          };

                          fixedAssets.forEach(a => {
                            const cc = a.costCenter || 'all';
                            if (centers[cc]) {
                              centers[cc].count += 1;
                              centers[cc].cost += a.cost;
                              centers[cc].net += a.netValue;
                            }
                          });

                          return Object.keys(centers).map((key, idx) => (
                            <tr key={idx} className="h-9 hover:bg-slate-50">
                              <td className="px-4 font-black text-slate-900">{centers[key].name}</td>
                              <td className="px-4 text-center font-sans font-extrabold text-indigo-700">{centers[key].count} أصل</td>
                              <td className="px-4 text-center font-mono">{(centers[key].cost).toLocaleString()} د.ل</td>
                              <td className="px-4 text-left font-mono font-black text-emerald-700">{(centers[key].net).toLocaleString()} د.ل</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  )}

                  {/* REPORT: MAINTENANCE EXPENDITURES */}
                  {activeAssetTab === 'maintenance' && (
                    <table className="w-full text-right border-collapse text-[11px]">
                      <thead className="bg-slate-800 text-slate-100 font-bold border-b border-slate-200 h-9">
                        <tr>
                          <th className="px-4">اسم الأصل الثابت المعني بالصيانة</th>
                          <th className="px-4">كود الصيانة</th>
                          <th className="px-4">نوع الخدمة</th>
                          <th className="px-4 text-center">تاريخ التنفيذ والاعتماد</th>
                          <th className="px-4">المورد/المركز الفني القائم بالخدمة</th>
                          <th className="px-4 text-center">تكلفة الإصلاح الكلية</th>
                          <th className="px-4 text-left">ملاحظات ونتائج فحص الحالة الفنية</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                        {(() => {
                          const logsList: any[] = [];
                          fixedAssets.forEach(a => {
                            (a.maintenanceLogs || []).forEach((m: any) => {
                              logsList.push({ ...m, assetName: a.name });
                            });
                          });

                          return logsList.map((m, idx) => (
                            <tr key={idx} className="h-9 hover:bg-slate-50">
                              <td className="px-4 font-black text-slate-950">{m.assetName}</td>
                              <td className="px-4 font-mono font-bold text-slate-500">{m.id}</td>
                              <td className="px-4">
                                <span className="bg-indigo-50 text-indigo-800 px-1.5 py-0.2 rounded border border-indigo-100 font-bold">
                                  صيانة {m.type}
                                </span>
                              </td>
                              <td className="px-4 text-center font-mono text-slate-500">{m.date}</td>
                              <td className="px-4 text-slate-700">{m.supplier}</td>
                              <td className="px-4 text-center font-mono font-black text-indigo-700">{m.cost.toLocaleString()} د.ل</td>
                              <td className="px-4 text-left text-slate-600 italic font-medium">{m.notes}</td>
                            </tr>
                          ));
                        })()}

                        {fixedAssets.every(a => !a.maintenanceLogs || a.maintenanceLogs.length === 0) && (
                          <tr>
                            <td colSpan={7} className="text-center p-8 text-slate-400 font-bold">
                              لا تتوفر سجلات أو عمليات صيانة مسجلة حتى تاريخه.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* REPORT: DISCARDED AND SOLD ASSETS */}
                  {activeAssetTab === 'discarded_sold' && (
                    <table className="w-full text-right border-collapse text-[11px]">
                      <thead className="bg-slate-800 text-slate-100 font-bold border-b border-slate-200 h-9">
                        <tr>
                          <th className="px-4">رقم الأصل</th>
                          <th className="px-4">اسم الأصل الثابت</th>
                          <th className="px-4 text-center">تكلفة الاقتناء التاريخية</th>
                          <th className="px-4 text-center">مجمع الإهلاك المشطوب</th>
                          <th className="px-4 text-center">الوضع النهائي للأصل</th>
                          <th className="px-4 text-left">ملاحظات وشهادة الشطب والتكهين</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                        {fixedAssets.filter(fa => fa.status === 'تم بيعه' || fa.status === 'مستبعد').map(fa => (
                          <tr key={fa.id} className="h-9 hover:bg-slate-50">
                            <td className="px-4 font-mono font-bold text-slate-600">{fa.id}</td>
                            <td className="px-4 font-extrabold text-slate-900">{fa.name}</td>
                            <td className="px-4 text-center font-mono">{fa.cost.toLocaleString()} د.ل</td>
                            <td className="px-4 text-center font-mono text-rose-600">-{fa.accDep.toLocaleString()} د.ل</td>
                            <td className="px-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                                fa.status === 'تم بيعه' ? 'bg-blue-50 text-blue-800 border-blue-100' : 'bg-slate-50 text-slate-800 border-slate-200'
                              }`}>
                                {fa.status}
                              </span>
                            </td>
                            <td className="px-4 text-left text-slate-500 italic">
                              {fa.operations && fa.operations.find((op: any) => op.type === 'بيع الأصل' || op.type === 'استبعاد الأصل')?.details || 'تمت تسوية الحسابات شطباً للكهنة'}
                            </td>
                          </tr>
                        ))}

                        {fixedAssets.filter(fa => fa.status === 'تم بيعه' || fa.status === 'مستبعد').length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center p-8 text-slate-400 font-bold">
                              لم يتم التخلص من أي أصول بالبيع أو الاستبعاد خلال السنة المالية المحددة.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}

                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* SUB-MODALS & DIALOGS FOR INTERACTIVE ASSET OPERATIONS */}
            {/* ========================================================== */}
            {assetActionModal !== 'none' && (
              <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
                <div className={`bg-white rounded-2xl border border-slate-200 shadow-xl w-full ${
                  assetActionModal === 'print_card' ? 'max-w-md' :
                  assetActionModal === 'print_schedule' ? 'max-w-4xl' :
                  'max-w-lg'
                } overflow-hidden text-right`}>
                  
                  {/* Modal Header */}
                  <div className="bg-slate-900 p-4 px-6 text-white flex justify-between items-center">
                    <h3 className="font-black text-sm">
                      {assetActionModal === 'maintenance' && '⚙️ قيد وترحيل أعمال صيانة جديدة للأصل'}
                      {assetActionModal === 'transfer' && '🚚 نقل الأصل وتغيير العهدة والموقع المالي'}
                      {assetActionModal === 'sale' && '💰 تسجيل بيع أصل ثابت وترحيل سند القبض'}
                      {assetActionModal === 'discard' && '❌ استبعاد وتكهين أصل تالف وشطب القيمة (قيد خسائر)'}
                      {assetActionModal === 'print_card' && '🖨️ معاينة وطباعة بطاقة تعريف الأصل والترميز الثابت'}
                      {assetActionModal === 'print_schedule' && '🧮 معاينة ومخطط استهلاك الأصل السنوي'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setAssetActionModal('none')}
                      className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal Body / Forms */}
                  <div className="p-6 space-y-4 text-slate-800 text-xs font-semibold">
                    
                    {/* FORM A: MAINTENANCE */}
                    {activeAssetTab === 'maintenance' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">نوع أعمال الصيانة:</label>
                            <select
                              value={assetForm.type}
                              onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value as any })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold focus:outline-none"
                            >
                              <option value="دورية">دورية (Preventive)</option>
                              <option value="طارئة">طارئة (Breakdown)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-700 font-bold mb-1">تكلفة الصيانة (د.ل):</label>
                            <input
                              type="number"
                              required
                              placeholder="مثال: 1250"
                              value={assetForm.cost}
                              onChange={(e) => setAssetForm({ ...assetForm, cost: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-indigo-700 font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">المورد / المركز الفني القائم بالخدمة:</label>
                          <input
                            type="text"
                            placeholder="اسم الورشة أو الوكيل الفني"
                            value={assetForm.supplier}
                            onChange={(e) => setAssetForm({ ...assetForm, supplier: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">تاريخ صيانة السند:</label>
                            <input
                              type="date"
                              value={assetForm.date}
                              onChange={(e) => setAssetForm({ ...assetForm, date: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-center"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-bold mb-1">موعد الفحص والصيانة القادم:</label>
                            <input
                              type="date"
                              value={assetForm.nextDate}
                              onChange={(e) => setAssetForm({ ...assetForm, nextDate: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-center"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">حالة الأصل بعد الصيانة:</label>
                          <select
                            value={assetForm.statusAfter}
                            onChange={(e) => setAssetForm({ ...assetForm, statusAfter: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold focus:outline-none"
                          >
                            <option value="ممتاز">ممتاز (Excellent)</option>
                            <option value="جيد جداً">جيد جداً</option>
                            <option value="جيد (يعمل بكفاءة)">جيد (يعمل بكفاءة)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">التقرير والبيان التفصيلي للإصلاح:</label>
                          <textarea
                            placeholder="وصف المشكلة والأعمال المنجزة وتغيير قطع الغيار"
                            rows={3}
                            value={assetForm.notes}
                            onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-xs leading-relaxed"
                          ></textarea>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 font-medium text-[10px] text-emerald-800 leading-relaxed">
                          ⚠️ <strong>الأثر المحاسبي التلقائي للربط:</strong> سيتم إنشاء سند صرف مالي (Payment Voucher) لصالح المورد مدين لحساب مصروف الصيانة (5230) دائن لحساب مصرف الوحدة (1102).
                        </div>

                        {/* Modal Footer actions */}
                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={handleMaintenanceSubmit}
                            className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold p-2.5 px-5 rounded-lg flex-1 cursor-pointer"
                          >
                            ترحيل صيانة وسند صرف 💸
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssetActionModal('none')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold p-2.5 px-4 rounded-lg cursor-pointer"
                          >
                            إلغاء التعديل
                          </button>
                        </div>
                      </div>
                    )}

                    {/* FORM B: TRANSFER */}
                    {assetActionModal === 'transfer' && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] leading-relaxed">
                          الأصل الحالي موطن بـ: <strong>{assetForm.branch}</strong> بعهدة الموظف: <strong>{assetForm.responsible || 'غير محدد'}</strong> بمقر استخدام: <strong>{assetForm.location || 'غير محدد'}</strong>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">الفرع المالي الموطن الجديد:</label>
                            <input
                              type="text"
                              required
                              value={assetForm.toBranch}
                              onChange={(e) => setAssetForm({ ...assetForm, toBranch: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-bold mb-1">تاريخ النقل والعهدة:</label>
                            <input
                              type="date"
                              value={assetForm.date}
                              onChange={(e) => setAssetForm({ ...assetForm, date: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-center"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">موقع الاستخدام الفعلي الفوري الجديد:</label>
                          <input
                            type="text"
                            required
                            placeholder="مثال: المعمل الكيميائي الجديد - المبنى ب"
                            value={assetForm.toDept}
                            onChange={(e) => setAssetForm({ ...assetForm, toDept: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">المسؤول الجديد الحامل للعهدة الشخصية:</label>
                          <input
                            type="text"
                            required
                            placeholder="اسم الموظف المستلم بالكامل"
                            value={assetForm.toResponsible}
                            onChange={(e) => setAssetForm({ ...assetForm, toResponsible: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">ملاحظات تسليم واستلام وتبرير الحركة:</label>
                          <textarea
                            placeholder="أسباب نقل الأصل وتوثيق موافقة الإدارة المعنية بالعهدة"
                            rows={3}
                            value={assetForm.notes}
                            onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-xs leading-relaxed"
                          ></textarea>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 font-medium text-[10px] text-blue-800 leading-relaxed">
                          ℹ️ <strong>الأثر الإداري التلقائي:</strong> سيتم تسجيل التعديل على بطاقة الأصل، وإضافة قيد حركة جديد في جدول حركات عهد الأصل للمطابقة والجرد المستمر.
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={handleTransferAssetSubmit}
                            className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold p-2.5 px-5 rounded-lg flex-1 cursor-pointer"
                          >
                            تثبيت نقل الأصل والعهدة 🚚
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssetActionModal('none')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold p-2.5 px-4 rounded-lg cursor-pointer"
                          >
                            إلغاء التعديل
                          </button>
                        </div>
                      </div>
                    )}

                    {/* FORM C: SALE */}
                    {assetActionModal === 'sale' && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] leading-relaxed space-y-1">
                          <div>الأصل المراد بيعه: <strong>{assetForm.name}</strong></div>
                          <div>القيمة الدفترية المتبقية الحالية بالأستاذ: <strong className="text-emerald-700">{assetForm.netValue.toLocaleString()} د.ل</strong></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">سعر البيع النهائي المتفق عليه (د.ل):</label>
                            <input
                              type="number"
                              required
                              placeholder="مثال: 95000"
                              value={assetForm.price}
                              onChange={(e) => setAssetForm({ ...assetForm, price: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-indigo-700 font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-bold mb-1">تاريخ عملية البيع:</label>
                            <input
                              type="date"
                              value={assetForm.date}
                              onChange={(e) => setAssetForm({ ...assetForm, date: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-center"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">اسم المشتري / العميل المستلم للأصل:</label>
                          <input
                            type="text"
                            required
                            placeholder="الجهة أو الشركة أو الفرد المستلم بالكامل"
                            value={assetForm.buyer}
                            onChange={(e) => setAssetForm({ ...assetForm, buyer: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">شرح وبيان تبرير ومصوغات البيع والاعتماد:</label>
                          <textarea
                            placeholder="موافقة مجلس الإدارة وأسباب الاستغناء بالبيع لتفادي الخسارة"
                            rows={3}
                            value={assetForm.notes}
                            onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-xs leading-relaxed"
                          ></textarea>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 font-medium text-[10px] text-emerald-800 leading-relaxed">
                          ⚠️ <strong>الأثر المحاسبي التلقائي للربط:</strong> سيتم تسجيل الأصل بـ "تم بيعه" وتعديل قيمته الدفترية لصفر، مع ترحيل سند قبض مالي بقيمة البيع لحساب مصرف الوحدة (1102)، وقيد تسوية الأرباح/الخسائر الرأسمالية تلقائياً بالأستاذ.
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={handleSellAssetSubmit}
                            className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold p-2.5 px-5 rounded-lg flex-1 cursor-pointer"
                          >
                            ترحيل عملية البيع وسند القبض 💰
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssetActionModal('none')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold p-2.5 px-4 rounded-lg cursor-pointer"
                          >
                            إلغاء التعديل
                          </button>
                        </div>
                      </div>
                    )}

                    {/* FORM D: DISCARD */}
                    {assetActionModal === 'discard' && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] leading-relaxed space-y-1">
                          <div>الأصل المراد استبعاده بالكامل: <strong>{assetForm.name}</strong></div>
                          <div>القيمة الدفترية للأستاذ المشطوبة: <strong className="text-rose-600">{assetForm.netValue.toLocaleString()} د.ل</strong></div>
                          <div>مجمع الإهلاك المشطوب: <strong className="text-rose-600">{assetForm.accDep.toLocaleString()} د.ل</strong></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">تاريخ الشطب التام:</label>
                            <input
                              type="date"
                              value={assetForm.date}
                              onChange={(e) => setAssetForm({ ...assetForm, date: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-center"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-bold mb-1">حساب تسوية خسائر التخريد:</label>
                            <select
                              value={assetForm.lossAccount}
                              onChange={(e) => setAssetForm({ ...assetForm, lossAccount: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold focus:outline-none"
                            >
                              <option value="5270">5270 - خسائر التخلص واستبعاد الأصول والكهنة</option>
                              <option value="5230">5230 - مصاريف تشغيلية وصيانة أخرى</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">التقرير الفني لتلف وتخريد الأصل ومبررات الاستبعاد:</label>
                          <textarea
                            placeholder="مثال: احتراق كامل للمحرك نتيجة تذبذب التيار الكهربائي وتخريده لعدم جدوى الصيانة الاقتصادية"
                            rows={3}
                            value={assetForm.notes}
                            onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-xs leading-relaxed"
                          ></textarea>
                        </div>

                        <div className="bg-rose-50 border border-rose-100 rounded-lg p-2.5 font-medium text-[10px] text-rose-800 leading-relaxed">
                          ⚠️ <strong>الأثر المحاسبي التلقائي للربط:</strong> سيتم شطب الأصل وتغيير حالته لـ "مستبعد" وإغلاق حساب مجمع الاستهلاك المشطوب، مع إصدار قيد يومية تلقائي يرحل القيمة الدفترية المتبقية للأصل كخسارة رأسمالية استثنائية بحساب الخسائر (5270).
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={handleDiscardAssetSubmit}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold p-2.5 px-5 rounded-lg flex-1 cursor-pointer"
                          >
                            ترحيل شطب الأصل وقيد الخسائر اليومية ❌
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssetActionModal('none')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold p-2.5 px-4 rounded-lg cursor-pointer"
                          >
                            إلغاء التعديل
                          </button>
                        </div>
                      </div>
                    )}

                    {/* MODAL E: PRINT ASSET CARD PREVIEW */}
                    {assetActionModal === 'print_card' && (
                      <div className="space-y-6">
                        <div id="printable-asset-card" className="border-2 border-slate-300 rounded-2xl p-6 bg-white shadow-xs max-w-sm mx-auto text-right font-sans relative overflow-hidden">
                          {/* Card Ribbon Accent */}
                          <div className="absolute top-0 right-0 left-0 h-1.5 bg-indigo-600"></div>
                          
                          {/* Card Header */}
                          <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-4">
                            <div>
                              <span className="text-[9px] text-slate-400 block font-bold">مدرسة الأسرة الحديثة - نظام الأصول</span>
                              <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{assetForm.name || 'أصل ثابت'}</h4>
                              <span className="font-mono text-[9px] text-indigo-600 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                                {assetForm.id} | {assetForm.code}
                              </span>
                            </div>
                            <span className="text-2xl">🏢</span>
                          </div>

                          {/* Card Grid Details */}
                          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[10px] text-slate-700">
                            <div>
                              <span className="text-slate-400 font-bold block text-[8px]">التصنيف الرئيسي:</span>
                              <span className="font-black text-slate-800">{assetForm.category}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-bold block text-[8px]">موقع الأصل الحالي:</span>
                              <span className="font-black text-slate-800">{assetForm.location || 'غير محدد'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-bold block text-[8px]">حامل العهدة الشخصية:</span>
                              <span className="font-black text-slate-800">{assetForm.responsible || 'شؤون إدارية'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-bold block text-[8px]">تاريخ التملك:</span>
                              <span className="font-mono font-bold text-slate-800">{assetForm.purchaseDate}</span>
                            </div>
                            <div className="col-span-2 border-t border-slate-100 pt-2 grid grid-cols-3 gap-2 text-center">
                              <div>
                                <span className="text-slate-400 block text-[8px]">التكلفة التاريخية:</span>
                                <span className="font-mono font-bold text-slate-900">{(parseFloat(assetForm.cost as any || 0)).toLocaleString()} د.ل</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[8px]">مجمع الإهلاك:</span>
                                <span className="font-mono font-bold text-rose-600">{(parseFloat(assetForm.accDep as any || 0)).toLocaleString()} د.ل</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[8px]">القيمة الدفترية:</span>
                                <span className="font-mono font-black text-emerald-600">{(parseFloat(assetForm.cost as any || 0) + parseFloat(assetForm.capitalExp as any || 0) - parseFloat(assetForm.accDep as any || 0)).toLocaleString()} د.ل</span>
                              </div>
                            </div>
                          </div>

                          {/* Barcode Block */}
                          <div className="mt-5 pt-3.5 border-t border-slate-200 text-center space-y-1.5">
                            <div className="font-mono text-[10px] tracking-[6px] font-bold text-slate-800 bg-slate-50 border border-slate-200 py-1.5 inline-block px-4 rounded-md">
                              |||| {assetForm.barcode || assetForm.id} ||||
                            </div>
                            <span className="text-[8px] text-slate-400 block font-semibold">باركود مطابقة الأصول الثابتة والترميز الرقمي</span>
                          </div>
                        </div>

                        {/* Interactive Actions */}
                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              const cardElement = document.getElementById('printable-asset-card');
                              if (cardElement) {
                                const printContent = cardElement.innerHTML;
                                const printWindow = window.open('', '_blank');
                                if (printWindow) {
                                  printWindow.document.write(`
                                    <html dir="rtl" lang="ar">
                                      <head>
                                        <title>بطاقة الأصل - ${assetForm.name}</title>
                                        <style>
                                          body { font-family: 'Inter', system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fff; }
                                          .print-box { border: 2px solid #000; padding: 25px; border-radius: 12px; max-width: 350px; width: 100%; text-align: right; }
                                          .flex { display: flex; justify-content: space-between; align-items: flex-start; }
                                          .border-b { border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 15px; }
                                          .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 10px; font-size: 11px; }
                                          .col-span-2 { grid-column: span 2; }
                                          .text-center { text-align: center; }
                                          .mt-5 { margin-top: 20px; }
                                          .pt-3.5 { padding-top: 15px; }
                                          .border-t { border-top: 1px solid #ddd; }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="print-box">${printContent}</div>
                                      </body>
                                    </html>
                                  `);
                                  printWindow.document.close();
                                  printWindow.focus();
                                  printWindow.print();
                                  printWindow.close();
                                } else {
                                  window.print();
                                }
                              }
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2.5 px-5 rounded-lg flex-1 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Printer className="w-4 h-4" />
                            <span>طباعة بطاقة الأصل 🖨️</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssetActionModal('none')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold p-2.5 px-4 rounded-lg cursor-pointer"
                          >
                            إغلاق المعاينة
                          </button>
                        </div>
                      </div>
                    )}

                    {/* MODAL F: PRINT DEPRECIATION SCHEDULE PREVIEW */}
                    {assetActionModal === 'print_schedule' && (
                      <div className="space-y-6">
                        <div id="printable-asset-schedule" className="bg-white p-2 text-right">
                          <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                              <div>
                                <h4 className="text-sm font-black text-slate-900">مخطط وجدول استهلاك الأصل السنوي التقديري</h4>
                                <p className="text-[10px] text-slate-500 mt-1">
                                  اسم الأصل: <strong className="text-slate-700">{assetForm.name}</strong> | كود الأصل: <strong className="text-slate-700">{assetForm.code}</strong>
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 font-mono">طريقة الإهلاك: {assetForm.depMethod} ({assetForm.depRate})</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-slate-50 rounded-xl text-[10px]">
                              <div>
                                <span className="text-slate-400 block font-bold">القيمة التاريخية:</span>
                                <span className="font-mono font-black text-slate-800">{parseFloat(assetForm.cost as any || 0).toLocaleString()} د.ل</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-bold">العمر الإنتاجي:</span>
                                <span className="font-bold text-slate-800">{assetForm.usefulLife} سنوات</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-bold">قيمة الخردة المقدرة:</span>
                                <span className="font-mono font-bold text-slate-800">{parseFloat(assetForm.scrapValue as any || 0).toLocaleString()} د.ل</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-bold">إجمالي القيمة القابلة للإهلاك:</span>
                                <span className="font-mono font-black text-indigo-700">{(parseFloat(assetForm.cost as any || 0) + parseFloat(assetForm.capitalExp as any || 0) - parseFloat(assetForm.scrapValue as any || 0)).toLocaleString()} د.ل</span>
                              </div>
                            </div>

                            <div className="overflow-x-auto border border-slate-100 rounded-lg shadow-xs">
                              <table className="w-full text-[10px] text-right border-collapse">
                                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 h-8">
                                  <tr>
                                    <th className="px-3 text-center">السنة المالية</th>
                                    <th className="px-3 text-center">القيمة القابلة للإهلاك</th>
                                    <th className="px-3 text-center">قسط الإهلاك السنوي</th>
                                    <th className="px-3 text-center">مجمع الإهلاك المتراكم</th>
                                    <th className="px-3 text-left">صافي القيمة الدفترية المتبقية</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                  {(() => {
                                    const costVal = parseFloat(assetForm.cost as any || 0);
                                    const capVal = parseFloat(assetForm.capitalExp as any || 0);
                                    const scrapVal = parseFloat(assetForm.scrapValue as any || 0);
                                    const usefulVal = parseInt(assetForm.usefulLife as any || 5);
                                    const depreciableAmount = costVal + capVal - scrapVal;
                                    const annualDep = depreciableAmount / usefulVal;
                                    let runningAcc = 0;

                                    return Array.from({ length: usefulVal }).map((_, i) => {
                                      const year = new Date(assetForm.purchaseDate || Date.now()).getFullYear() + i;
                                      const depThisYear = Math.min(depreciableAmount - runningAcc, annualDep);
                                      runningAcc += depThisYear;
                                      const netValRemaining = costVal + capVal - runningAcc;

                                      return (
                                        <tr key={i} className="h-8 hover:bg-slate-50/50">
                                          <td className="px-3 text-center font-bold text-slate-600">السنة {i + 1} ({year})</td>
                                          <td className="px-3 text-center font-mono">{depreciableAmount.toLocaleString()} د.ل</td>
                                          <td className="px-3 text-center font-mono text-rose-500">-{depThisYear.toLocaleString()} د.ل</td>
                                          <td className="px-3 text-center font-mono text-rose-600">{runningAcc.toLocaleString()} د.ل</td>
                                          <td className="px-3 text-left font-mono font-black text-emerald-700">{netValRemaining.toLocaleString()} د.ل</td>
                                        </tr>
                                      );
                                    });
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Actions */}
                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              const scheduleElement = document.getElementById('printable-asset-schedule');
                              if (scheduleElement) {
                                const printContent = scheduleElement.innerHTML;
                                const printWindow = window.open('', '_blank');
                                if (printWindow) {
                                  printWindow.document.write(`
                                    <html dir="rtl" lang="ar">
                                      <head>
                                        <title>جدول استهلاك وإهلاك الأصل - ${assetForm.name}</title>
                                        <style>
                                          body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
                                          .border { border: 1px solid #ddd; padding: 25px; border-radius: 12px; }
                                          .flex { display: flex; justify-content: space-between; align-items: flex-start; }
                                          .border-b { border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 15px; }
                                          .grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 11px; margin-bottom: 20px; }
                                          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
                                          th { background: #f1f5f9; padding: 10px; text-align: center; border-bottom: 2px solid #ddd; }
                                          td { padding: 10px; border-bottom: 1px solid #eee; text-align: center; }
                                          .text-left { text-align: left; }
                                          .font-mono { font-family: monospace; }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="border">${printContent}</div>
                                      </body>
                                    </html>
                                  `);
                                  printWindow.document.close();
                                  printWindow.focus();
                                  printWindow.print();
                                  printWindow.close();
                                } else {
                                  window.print();
                                }
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 px-5 rounded-lg flex-1 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Printer className="w-4 h-4" />
                            <span>طباعة خطة الإهلاك السنوية 🖨️</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssetActionModal('none')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold p-2.5 px-4 rounded-lg cursor-pointer"
                          >
                            إغلاق المعاينة
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              </div>
            )}

          </div>
        )}


    </>
  );
};
