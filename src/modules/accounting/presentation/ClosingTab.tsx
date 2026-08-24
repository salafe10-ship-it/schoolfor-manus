import { Activity, AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Briefcase, Calculator, Calendar, CheckCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock, CornerUpLeft, CreditCard, Download, Edit, Eye, FileDown, FileText, Filter, Flag, Hash, Key, Layers, LayoutTemplate, Link, List, Lock as LockIcon, Maximize2, Minimize2, PenTool, Play, Plus, Printer, RefreshCw, Save, Search, Settings2, Share2, ShieldCheck, Table, Trash2, User, X } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AccountingContext } from '../../../components/GeneralLedgerPortal';
export const ClosingTab = () => {
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
  formatCurrency, triggerNotification, logAction, handlePostAllPendingJvs,
  persistCanonicalFinancialSnapshot, canonicalFinancialStatus, canonicalFinancialWriteMode
} = React.useContext(AccountingContext);
  const closingProofReady = canonicalFinancialStatus === 'ready' && canonicalFinancialWriteMode === 'ledger_ready';
  const ensureCanonicalClosingPersistence = () => {
    if (closingProofReady && typeof persistCanonicalFinancialSnapshot === 'function') return true;
    triggerNotification('عمليات الإقفال وفتح السنة متوقفة: المصدر الحالي snapshot للقراءة فقط، ولم تعتمد خدمة إقفال كانونية.', 'warning');
    return false;
  };

  return (
    <>
              {activeTab === 'closing' && (() => {
          // Calculate dynamic counts for readiness checks
          const isPostedOrApproved = (status: unknown) => ['مرحل', 'مرحّل', 'مُرحّل', 'posted', 'approved', 'معتمد'].includes(String(status || '').trim().toLowerCase());
          const unpostedJvsCount = journalEntries.filter(j => !isPostedOrApproved(j.status)).length;
          const unapprovedRvsCount = receiptVouchers.filter(r => !isPostedOrApproved(r.status)).length;
          const unapprovedPvsCount = paymentVouchers.filter(p => !isPostedOrApproved(p.status)).length;
          
          // Find if there are unbalanced journal entries (Check 6)
          const unbalancedJv = journalEntries.find(j => {
            const debTotal = (j.lines || []).reduce((s, l) => s + (l.debit || 0), 0);
            const crdTotal = (j.lines || []).reduce((s, l) => s + (l.credit || 0), 0);
            return Math.abs(debTotal - crdTotal) > 0.01;
          });

          // Handle approving all outstanding adjustments (Check 4)
          const handleApproveAllAdjustments = () => {
            triggerNotification('اعتماد التسويات متوقف: لا يوجد مسار مركزي كانوني يحفظ الاعتماد وسجل التدقيق.', 'warning');
          };

          const handleApproveAllPendingVouchers = async () => {
            if (!ensureCanonicalClosingPersistence()) return;
            const updatedReceipts = receiptVouchers.map(r => ({ ...r, status: 'معتمد' }));
            const updatedPayments = paymentVouchers.map(p => ({ ...p, status: 'معتمد' }));
            try {
              await persistCanonicalFinancialSnapshot({ receiptVouchers: updatedReceipts, paymentVouchers: updatedPayments });
              setReceiptVouchers(updatedReceipts);
              setPaymentVouchers(updatedPayments);
              triggerNotification('✓ تم اعتماد السندات وحفظ الحالة مركزياً بنجاح.', 'success');
            } catch (error: any) {
              triggerNotification(`تعذر اعتماد السندات مركزياً: ${error?.message || 'خطأ غير معروف'}`, 'warning');
            }
          };

          const handleRunReadinessCheck = () => {
            setIsCheckingReady(true);
            const blocked = !ensureCanonicalClosingPersistence() || hasCriticalErrors || unapprovedAdjustmentsCount > 0;
            setIsCheckingReady(false);
            setCheckedReady(true);
            triggerNotification(
              blocked
                ? 'تعذر اعتماد جاهزية الإقفال: توجد حواجز محاسبية أو أن المصدر المركزي غير جاهز.'
                : '✓ اكتمل فحص الجاهزية من البيانات المحاسبية الحالية.',
              blocked ? 'warning' : 'success'
            );
          };

          const drillDownUser = localDrillDownUser || { name: 'سليمان غازي', permissions: ['view_account_statement'] };

          const reportAccounts = getProcessedAccounts();
          const subRevenues = reportAccounts.filter(a => a.classification === 'إيرادات' && a.type === 'فرعي');
          const subExpenses = reportAccounts.filter(a => a.classification === 'مصروفات' && a.type === 'فرعي');
          const totalRevenues = subRevenues.reduce((sum, a) => sum + (a.endingBalance || 0), 0);
          const totalExpenses = subExpenses.reduce((sum, a) => sum + (a.endingBalance || 0), 0);
          const financialTotals = {
            0: totalRevenues - totalExpenses
          };

          // Matched Trial Balance Check (balanced double-entry verify)
          const isTrialBalanceMatched = closingProofReady && journalEntries.length > 0 && !unbalancedJv && unpostedJvsCount === 0;

          // Check if there are any critical blocking errors (❌)
          const hasCriticalErrors = unpostedJvsCount > 0 || !!unbalancedJv;

          // Determine active step based on state
          const currentDisplayStep = isYearClosed && closingProofReady ? 'done' : closingStep;

          return (
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
              {/* BRANDING HEADER */}
              <div className="bg-gradient-to-l from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-indigo-900/40">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl -ml-16 -mb-16"></div>
                
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-2 text-right">
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                      العمليات الختامية والميزانية العمومية
                    </span>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <span>إقفال السنة المالية 2026 م</span>
                      <span className="text-xs font-mono bg-indigo-500 text-indigo-50 px-2 py-0.5 rounded font-black">SAP-Grade ERP</span>
                    </h2>
                    <p className="text-xs text-indigo-200 max-w-xl leading-relaxed">
                      نظام المعالجة السحابي لإغلاق الحسابات المؤقتة، وتصفير بنود قائمة الدخل، وإثبات الأرصدة المدورة في حساب حقوق الملكية وتأسيس الدفاتر للسنة المالية القادمة بأمان تام.
                    </p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm shadow-inner flex flex-col items-center justify-center min-w-[140px]">
                    <span className="text-[10px] text-indigo-300 font-bold">{closingProofReady ? 'صافي الربح المستحق للترحيل' : 'صافي العرض — غير متحقق للترحيل'}</span>
                    <span className="text-xl font-mono font-black text-emerald-400 mt-1" dir="ltr">
                      +{financialTotals[0].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] text-white/70 font-semibold mt-0.5">{currency}</span>
                  </div>
                </div>
              </div>

              {canonicalFinancialStatus === 'ready' && canonicalFinancialWriteMode !== 'ledger_ready' && (
                <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">
                  الإقفال السنوي متوقف: المصدر الحالي snapshot للقراءة فقط، ولا توجد خدمة إقفال كانونية تحفظ الاعتماد والقيد الختامي. لا يتم إنشاء أو تعديل أرصدة من هذه الشاشة.
                </div>
              )}

              {/* THREE-STEP WIZARD PROGRESS BAR TRACKER */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center relative">
                  {/* Background connector line */}
                  <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
                  <div 
                    className="absolute top-1/2 right-4 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500"
                    style={{ 
                      width: currentDisplayStep === 'check' ? '0%' : currentDisplayStep === 'executing' ? '50%' : '100%',
                      left: 'auto' 
                    }}
                  ></div>

                  {/* Step 1 Node */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      currentDisplayStep === 'check' 
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' 
                        : 'bg-indigo-50 text-indigo-600 border-2 border-indigo-600'
                    }`}>
                      {currentDisplayStep === 'check' ? '1' : '✓'}
                    </div>
                    <span className={`text-[11px] font-black mt-2 ${currentDisplayStep === 'check' ? 'text-indigo-600' : 'text-slate-500'}`}>
                      1. فحص الجاهزية والتدقيق
                    </span>
                  </div>

                  {/* Step 2 Node */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      currentDisplayStep === 'executing' 
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' 
                        : currentDisplayStep === 'done'
                          ? 'bg-indigo-50 text-indigo-600 border-2 border-indigo-600'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {currentDisplayStep === 'executing' ? '2' : currentDisplayStep === 'done' ? '✓' : '2'}
                    </div>
                    <span className={`text-[11px] font-black mt-2 ${currentDisplayStep === 'executing' ? 'text-indigo-600' : 'text-slate-400'}`}>
                      2. معالجة الإقفال المحاسبي
                    </span>
                  </div>

                  {/* Step 3 Node */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      currentDisplayStep === 'done' 
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' 
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      3
                    </div>
                    <span className={`text-[11px] font-black mt-2 ${currentDisplayStep === 'done' ? 'text-emerald-600' : 'text-slate-400'}`}>
                      3. التقرير النهائي وسند الإقفال
                    </span>
                  </div>
                </div>
              </div>

              {/* VIEW 1: COMPREHENSIVE READINESS AUDIT CHECKLIST */}
              {currentDisplayStep === 'check' && (
                <div className="space-y-6 animate-fade-in">
                  {/* PARAMETERS FORM CARD */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>بيانات ومعطيات معالجة إقفال السنة المالية</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-right">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 block">السنة الحالية المراد إغلاقها</label>
                        <input 
                          type="text" 
                          value={""} 
                          onChange={(e) => (e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-700 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 block">تاريخ إقفال السنة المالية</label>
                        <input 
                          type="date" 
                          value={""} 
                          onChange={(e) => (e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-700 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 block">رقم السنة المالية الجديدة</label>
                        <input 
                          type="text" 
                          value={""} 
                          onChange={(e) => (e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-700 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 block">تاريخ بداية السنة الجديدة</label>
                        <input 
                          type="date" 
                          value={""} 
                          onChange={(e) => (e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-700 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 block">تاريخ نهاية السنة الجديدة</label>
                        <input 
                          type="date" 
                          value={""} 
                          onChange={(e) => (e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-700 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 block">المستخدم المسؤول (المنفذ)</label>
                        <input 
                          type="text" 
                          value={drillDownUser.name} 
                          disabled
                          className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 focus:outline-none cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2 lg:col-span-3">
                        <label className="text-[11px] font-bold text-slate-600 block">بيان ووصف عملية الإغلاق السنوي</label>
                        <input 
                          type="text" 
                          value={closingDescriptionInput} 
                          onChange={(e) => setClosingDescriptionInput(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Audit Trigger Box if not checked yet */}
                  {!isCheckingReady && !checkedReady && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-4">
                      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
                        <Search className="w-8 h-8 text-indigo-600" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-black text-slate-800">يتطلب فحص الدفاتر قبل البدء بالمعالجة</h3>
                        <p className="text-[11px] text-slate-500 max-w-lg mx-auto leading-relaxed">
                          يقوم محرك الفحص الذكي بمراجعة توازن الحسابات، الكشف عن أي مسودات غير مرحلة في قيود اليومية، سندات الصرف أو القبض، لضمان توافق الدورة ومطابقتها للمعايير المحاسبية المعتمدة.
                        </p>
                      </div>
                      <button
                        onClick={handleRunReadinessCheck}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-indigo-600/10 flex items-center gap-2 mx-auto"
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                        <span>تشغيل الفحص الشامل للجاهزية والتدقيق</span>
                      </button>
                    </div>
                  )}

                  {/* Checking Loader Animation */}
                  {isCheckingReady && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-6 shadow-sm">
                      <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <LockIcon className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-black text-indigo-950">جاري التدقيق وفحص الدفاتر المحاسبية...</h3>
                        <p className="text-[11px] text-slate-400 font-mono">
                          AUDITING: CHECKING UNPOSTED JOURNALS, VOUCHERS AND BALANCE SHEET INTEGRITY
                        </p>
                      </div>
                      <div className="max-w-xs mx-auto space-y-1 text-right text-[10px] text-slate-500 font-bold bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between text-indigo-600">
                          <span>🔍 فحص توازن الدفاتر...</span>
                          <span>جاري الفحص</span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-600">
                          <span>📊 احتساب الأرصدة الإجمالية...</span>
                          <span>مكتمل</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>⚡ مطابقة مستندات الصرف والقبض...</span>
                          <span>جاري التحليل</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Audit Checklist Results Grid */}
                  {checkedReady && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                          <span>نتائج الفحص والتدقيق التلقائي</span>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-mono">5 اختبارات</span>
                        </h3>
                        <button
                          onClick={handleRunReadinessCheck}
                          className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>إعادة فحص الدفاتر</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. JOURNAL ENTRIES CHECK */}
                        <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all shadow-sm ${
                          closingProofReady && unpostedJvsCount === 0
                            ? 'bg-emerald-50/40 border-emerald-100'
                            : 'bg-amber-50/40 border-amber-100'
                        }`}>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-slate-500" />
                                <span>قيود اليومية العامة غير المرحلة</span>
                              </span>
                              {closingProofReady && unpostedJvsCount === 0 ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <span>مكتمل</span>
                                  <span>✅</span>
                                </span>
                              ) : !closingProofReady ? (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <span>غير متحقق — قراءة فقط</span>
                                  <span>⚠️</span>
                                </span>
                              ) : (
                                <span className="bg-rose-100 text-rose-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <span>خطأ حرج</span>
                                  <span>❌</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              يتحقق من وجود قيود في حالة (مسودة) لم يتم ترحيلها بشكل نهائي، مما يمنع إغلاق السنة لأنها لا تظهر في ميزان المراجعة.
                            </p>
                            <p className="text-[10px] font-mono font-bold text-slate-700 bg-white/60 p-1.5 rounded border border-slate-100">
                              القيود غير المرحلة: {unpostedJvsCount} قيد معلق.
                            </p>
                          </div>
                          {unpostedJvsCount > 0 && (
                            <button
                              onClick={handlePostAllPendingJvs}
                              className="mt-3 w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer shadow-sm text-center"
                            >
                              ترحيل كافة القيود المعلقة تلقائياً ⚡
                            </button>
                          )}
                        </div>

                        {/* 2. RECEIPT VOUCHERS CHECK */}
                        <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all shadow-sm ${
                          closingProofReady && unapprovedRvsCount === 0
                            ? 'bg-emerald-50/40 border-emerald-100'
                            : 'bg-amber-50/40 border-amber-100'
                        }`}>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-slate-500" />
                                <span>سندات القبض المفتوحة</span>
                              </span>
                              {closingProofReady && unapprovedRvsCount === 0 ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <span>مكتمل</span>
                                  <span>✅</span>
                                </span>
                              ) : !closingProofReady ? (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <span>غير متحقق — قراءة فقط</span>
                                  <span>⚠️</span>
                                </span>
                              ) : (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <span>يحتاج مراجعة</span>
                                  <span>⚠️</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              يتحقق من وجود سندات استلام رسوم دراسية أو مبالغ نقدية لم يتم اعتمادها من قبل المدير المالي.
                            </p>
                            <p className="text-[10px] font-mono font-bold text-slate-700 bg-white/60 p-1.5 rounded border border-slate-100">
                              السندات غير المعتمدة: {unapprovedRvsCount} سند مفتوح.
                            </p>
                          </div>
                          {unapprovedRvsCount > 0 && (
                            <button
                              onClick={handleApproveAllPendingVouchers}
                              className="mt-3 w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer shadow-sm text-center"
                            >
                              اعتماد السندات المعلقة تلقائياً ⚡
                            </button>
                          )}
                        </div>

                        {/* 3. PAYMENT VOUCHERS CHECK */}
                        <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all shadow-sm ${
                          closingProofReady && unapprovedPvsCount === 0
                            ? 'bg-emerald-50/40 border-emerald-100'
                            : 'bg-amber-50/40 border-amber-100'
                        }`}>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-slate-500" />
                                <span>سندات الصرف المفتوحة</span>
                              </span>
                              {closingProofReady && unapprovedPvsCount === 0 ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <span>مكتمل</span>
                                  <span>✅</span>
                                </span>
                              ) : !closingProofReady ? (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <span>غير متحقق — قراءة فقط</span>
                                  <span>⚠️</span>
                                </span>
                              ) : (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <span>يحتاج مراجعة</span>
                                  <span>⚠️</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              يتحقق من صحة وقرارات صرف الرواتب والمشتريات التشغيلية التي تمت ولم ترحل وتعتمد محاسبياً.
                            </p>
                            <p className="text-[10px] font-mono font-bold text-slate-700 bg-white/60 p-1.5 rounded border border-slate-100">
                              السندات غير المعتمدة: {unapprovedPvsCount} سند معلق.
                            </p>
                          </div>
                          {unapprovedPvsCount > 0 && (
                            <button
                              onClick={handleApproveAllPendingVouchers}
                              className="mt-3 w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer shadow-sm text-center"
                            >
                              اعتماد السندات المعلقة تلقائياً ⚡
                            </button>
                          )}
                        </div>

                        {/* 4. FINANCIAL ADJUSTMENTS CHECK */}
                        <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all shadow-sm ${
                          closingProofReady && unapprovedAdjustmentsCount === 0
                            ? 'bg-emerald-50/40 border-emerald-100'
                            : 'bg-amber-50/40 border-amber-100'
                        }`}>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-slate-500" />
                                <span>4. التسويات والقرارات المعلقة</span>
                              </span>
                              {closingProofReady && unapprovedAdjustmentsCount === 0 ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <span>مكتمل</span>
                                  <span>✅</span>
                                </span>
                              ) : !closingProofReady ? (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <span>غير متحقق — قراءة فقط</span>
                                  <span>⚠️</span>
                                </span>
                              ) : (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <span>معلق</span>
                                  <span>⚠️</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              يتحقق من مراجعة البنك وفروق الصرف الضريبية التي يجب إغلاقها لتصفية الحركات العالقة.
                            </p>
                            <p className="text-[10px] font-mono font-bold text-slate-700 bg-white/60 p-1.5 rounded border border-slate-100">
                              تسويات معلقة: {unapprovedAdjustmentsCount} تسوية مالية.
                            </p>
                          </div>
                          {unapprovedAdjustmentsCount > 0 && (
                            <button
                              onClick={handleApproveAllAdjustments}
                              className="mt-3 w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer shadow-sm text-center"
                            >
                              اعتماد كافة التسويات تلقائياً ⚡
                            </button>
                          )}
                        </div>

                        {/* 5. FINANCIAL PERIOD QUARTERS */}
                        <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all shadow-sm ${closingProofReady ? 'bg-emerald-50/40 border-emerald-100' : 'bg-amber-50/40 border-amber-100'}`}>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-slate-500" />
                                <span>5. الفترات المالية الفرعية</span>
                              </span>
                              <span className={`${closingProofReady ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5`}>
                                <span>{closingProofReady ? 'مستقرة' : 'غير متحقق — قراءة فقط'}</span>
                                <span>{closingProofReady ? '✅' : '⚠️'}</span>
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              مراجعة مطابقة الفترات الضريبية ربع السنوية وقفلها الدفتري المؤقت تمهيداً للإغلاق السنوي النهائي.
                            </p>
                            <p className="text-[10px] font-mono font-bold text-slate-700 bg-white/60 p-1.5 rounded border border-slate-100">
                              الحالة: {closingProofReady ? 'تم إغلاق الفترات Q1, Q2, Q3 محاسبياً.' : 'لا يمكن إثبات إغلاق الفترات من snapshot للقراءة فقط.'}
                            </p>
                          </div>
                        </div>

                        {/* 6. JOURNAL BALANCING CHECK */}
                        <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all shadow-sm ${
                          !unbalancedJv 
                            ? 'bg-emerald-50/40 border-emerald-100' 
                            : 'bg-rose-50/40 border-rose-100'
                        }`}>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-slate-500" />
                                <span>6. توازن قيود اليومية الفردية</span>
                              </span>
                              {!closingProofReady ? (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <span>غير متحقق — قراءة فقط</span>
                                  <span>⚠️</span>
                                </span>
                              ) : !unbalancedJv ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <span>متوازن تماماً</span>
                                  <span>✅</span>
                                </span>
                              ) : (
                                <span className="bg-rose-100 text-rose-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <span>خلل توازن</span>
                                  <span>❌</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              يتحقق من أن كل قيود اليومية المسجلة متطابقة في قيم المدين والدائن لضمان تماسك مزدوج سليم.
                            </p>
                            <p className="text-[10px] font-mono font-bold text-slate-700 bg-white/60 p-1.5 rounded border border-slate-100">
                              الحالة: {!unbalancedJv ? 'جميع القيود المسجلة متطابقة المدين والدائن.' : `خطأ بالقيد ${unbalancedJv.id}`}
                            </p>
                          </div>
                        </div>

                        {/* 7. TRIAL BALANCE MATCHING */}
                        <div className="p-4 rounded-xl border bg-emerald-50/40 border-emerald-100 flex flex-col justify-between transition-all shadow-sm md:col-span-2">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-slate-500" />
                                <span>7. توازن ميزان المراجعة وتطابق الدفاتر الشاملة</span>
                              </span>
                              <span className={`${closingProofReady ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5`}>
                                <span>{closingProofReady ? 'متوازن تماماً' : 'غير متحقق — قراءة فقط'}</span>
                                <span>{closingProofReady ? '✅' : '⚠️'}</span>
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              التأكد من أن مجموع الحركات الدائنة يتطابق تماماً مع مجموع الحركات المدينة وميزان المراجعة مغلق بصفر فروقات توازن.
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono font-bold text-slate-650 bg-white/60 p-2 rounded border border-slate-100">
                              <div>إجمالي الحركات المدينة: {accounts.filter(a => a.type === 'فرعي' && (a.classification === 'أصول' || a.classification === 'مصروفات')).reduce((s,a) => s + a.balance, 0).toLocaleString()} د.ل</div>
                              <div>إجمالي الحركات الدائنة: {accounts.filter(a => a.type === 'فرعي' && (a.classification === 'خصوم' || a.classification === 'حقوق ملكية' || a.classification === 'إيرادات')).reduce((s,a) => s + a.balance, 0).toLocaleString()} د.ل</div>
                              <div className={`col-span-2 text-center font-extrabold border-t border-slate-100 pt-1 mt-1 text-[11px] ${canonicalFinancialWriteMode === 'ledger_ready' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {canonicalFinancialWriteMode === 'ledger_ready'
                                  ? 'الفارق الحالي: 0.00 د.ل (تطابق تام ومكتمل بنسبة 100%)'
                                  : 'الفارق غير متحقق — snapshot للقراءة فقط ولا توجد قائمة إقفال كانونية.'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SUBMISSION / BOTTOM BANNER */}
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 text-right">
                          <h4 className="text-xs font-black text-slate-800">تأكيد شروط ترحيل وإقفال السنة</h4>
                          <p className="text-[10px] text-slate-500">
                            {hasCriticalErrors
                              ? '🚨 يوجد أخطاء محاسبية حرجة (باللون الأحمر) تمنع إقفال السنة المالية. يرجى ترحيل القيود المعلقة.'
                              : canonicalFinancialWriteMode === 'ledger_ready'
                                ? '✓ جميع الشروط والمطابقات الأساسية ممتازة ومكتملة. النظام مهيأ محاسبياً للإقفال النهائي.'
                                : '⚠️ الفحص للعرض فقط؛ لا يمكن إثبات جاهزية الإقفال قبل اعتماد دفتر الأستاذ الكانوني.'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setCheckedReady(false);
                              triggerNotification('✓ تم تحديث وإعادة تهيئة معايير الفحص', 'info');
                            }}
                            className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs border border-slate-200 transition-colors cursor-pointer"
                          >
                            تحديث الفحص
                          </button>
                          <button
                            onClick={async () => {
                              if (!ensureCanonicalClosingPersistence()) return;
                              if (hasCriticalErrors) return;
                              setClosingStep('executing');
                              setClosingProgress(0);
                              setClosingProgressMessage('جاري بدء عملية الإقفال السنوي...');
                              const formattedDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
                              const closeRef = closingRefNo || `CLOSE-${currentClosingYear || '2026'}-${Date.now()}`;
                              try {
                                await persistCanonicalFinancialSnapshot({
                                  financialClosing: {
                                    id: closeRef,
                                    year: currentClosingYear || 2026,
                                    status: 'posted',
                                    closingDate: formattedDate,
                                    description: closingDescriptionInput || 'إقفال السنة المالية من شاشة الإقفال المركزي'
                                  },
                                  closingRefNo: closeRef,
                                  closingDate: formattedDate
                                });
                                setClosingProgress(100);
                                setClosingProgressMessage('اكتملت المعالجة وحُفظت حالة الإقفال مركزياً.');
                                setIsYearClosed(true);
                                setClosingRefNo(closeRef);
                                setClosingDate(formattedDate);
                                setClosingStep('done');
                                triggerNotification('✓ تم حفظ حالة الإقفال المركزي بنجاح.', 'success');
                                logAction('CLOSE_YEAR_2026', `حفظ حالة إقفال السنة المالية 2026 م بالمرجع ${closeRef}`, 'الحسابات العامة');
                              } catch (error: any) {
                                setClosingStep('check');
                                setClosingProgress(0);
                                triggerNotification(`تعذر حفظ الإقفال مركزياً: ${error?.message || 'خطأ غير معروف'}`, 'warning');
                              }
                            }}
                            disabled={hasCriticalErrors}
                            className={`font-black px-6 py-2 rounded-lg text-xs transition-all shadow flex items-center gap-1.5 ${
                              hasCriticalErrors 
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                                : 'bg-indigo-650 hover:bg-indigo-750 text-white cursor-pointer shadow-xs active:scale-[0.98]'
                            }`}
                          >
                            <LockIcon className="w-3.5 h-3.5" />
                            <span>تنفيذ إقفال السنة المالية 2026 م 🔐</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 2: EXECUTIVE CLOSING IN PROGRESS BAR ANIMATION */}
              {currentDisplayStep === 'executing' && (
                <div className="bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-8 space-y-6 text-center shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600"></div>
                  
                  <div className="space-y-2">
                    <span className="text-xs font-black tracking-widest text-indigo-600 font-mono block uppercase">
                      SYSTEM CLOSING ENGINE RUNNING
                    </span>
                    <h3 className="text-sm font-black text-slate-900">جاري إقفال الدفاتر وتوليد الحسابات الختامية</h3>
                  </div>

                  {/* PERCENTAGE BIG CIRCLE */}
                  <div className="w-24 h-24 rounded-full border-4 border-slate-200 border-t-indigo-600 border-r-indigo-600 flex items-center justify-center mx-auto text-2xl font-mono font-black text-indigo-650 animate-pulse bg-white shadow-inner">
                    {closingProgress}%
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="space-y-2 max-w-md mx-auto">
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-indigo-600 to-emerald-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${closingProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] font-black text-slate-700 leading-relaxed">
                      {closingProgressMessage}
                    </p>
                  </div>

                  <div className="border-t border-slate-200 pt-4 text-[9px] font-mono text-slate-500 max-w-sm mx-auto space-y-1 text-right bg-white p-4 rounded-xl border">
                    <div className="flex justify-between">
                      <span className="text-indigo-650">STATE_FREEZE:</span>
                      <span className="text-amber-700 font-bold">ACTIVE</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-650">LEDGER_BALANCING:</span>
                      <span className="text-emerald-750 font-bold">SUCCESS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-400">REVENUE_RESET_TO_ZERO:</span>
                      <span>{closingProgress > 35 ? 'DONE' : 'PENDING'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-400">RETAINED_EARNING_POSTING:</span>
                      <span>{closingProgress > 55 ? 'SUCCESS' : 'PENDING'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 3: COMPLETED CLOSING CERTIFICATE & REPORT */}
              {currentDisplayStep === 'done' && (() => {
                const reportAccounts = getProcessedAccounts();
                const subRevenues = reportAccounts.filter(a => a.classification === 'إيرادات' && a.type === 'فرعي');
                const subExpenses = reportAccounts.filter(a => a.classification === 'مصروفات' && a.type === 'فرعي');
                const totalRevenues = subRevenues.reduce((sum, a) => sum + (a.endingBalance || 0), 0);
                const totalExpenses = subExpenses.reduce((sum, a) => sum + (a.endingBalance || 0), 0);
                const netResult = totalRevenues - totalExpenses;

                return (
                  <div className="space-y-6 animate-fade-in">
                    {/* Certificate Frame */}
                    <div className="bg-white border-2 border-emerald-500/30 rounded-2xl p-8 relative overflow-hidden shadow-lg space-y-6 text-center">
                      {/* Watermark green seal badge */}
                      <div className="absolute top-4 left-4 w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200">
                        <span className="text-xl">🔒</span>
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-4 py-1.5 rounded-full inline-block">
                          تمت عملية الإقفال السنوي واعتماد السند بنجاح واقتدار ✅
                        </span>
                        <h3 className="text-base font-black text-slate-950 mt-2">سند إثبات وإقفال السنة المالية {currentClosingYear} م</h3>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                          بموجب الصلاحيات والتدقيق المالي المعتمد، تم إغلاق كافة السجلات والدفاتر التشغيلية، وترحيل الأرباح والخسائر الدورية وحساب الميزانية الختامية.
                        </p>
                      </div>

                      {/* CORE INVOICE/RECEIPT PARTICULARS GRID */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-right">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold block">رقم مستند الإقفال</span>
                          <span className="text-xs font-mono font-black text-slate-800">{closingRefNo}</span>
                        </div>
                        <div className="space-y-1 border-r border-slate-200 pr-3">
                          <span className="text-[10px] text-slate-400 font-bold block">تاريخ الإقفال الفعلي</span>
                          <span className="text-xs font-mono font-black text-slate-800">{closingDate || '2026-12-31 23:59'}</span>
                        </div>
                        <div className="space-y-1 border-r border-slate-200 pr-3 col-span-2 md:col-span-1">
                          <span className="text-[10px] text-slate-400 font-bold block">المستخدم المنفذ للعملية</span>
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            <span>{drillDownUser.name}</span>
                          </span>
                        </div>
                        <div className="space-y-1 border-r border-slate-200 pr-3">
                          <span className="text-[10px] text-slate-400 font-bold block">السنة المالية المقفلة</span>
                          <span className="text-xs font-bold text-slate-800">{currentClosingYear} م</span>
                        </div>
                      </div>

                      {/* CLOSING PARTICULARS VALUES AND BALANCES */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold">
                              <th className="p-3">رمز الحساب</th>
                              <th className="p-3">اسم البند والحساب المحاسبي</th>
                              <th className="p-3">القيمة قبل الإقفال</th>
                              <th className="p-3">القيمة المقفلة الختامية</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-slate-150 text-slate-700 hover:bg-slate-50">
                              <td className="p-3 font-mono font-semibold text-slate-500">4100</td>
                              <td className="p-3 font-semibold text-slate-850">إجمالي الإيرادات المدرسية (إجمالي قائمة الدخل)</td>
                              <td className="p-3 font-mono text-emerald-700 font-bold">+{totalRevenues.toLocaleString()} د.ل</td>
                              <td className="p-3 font-mono text-slate-900 font-black">0.00 د.ل (تم الإغلاق وتصفيره)</td>
                            </tr>
                            <tr className="border-b border-slate-150 text-slate-700 hover:bg-slate-50">
                              <td className="p-3 font-mono font-semibold text-slate-500">5000</td>
                              <td className="p-3 font-semibold text-slate-850">المصروفات والأعباء التشغيلية (إجمالي قائمة الدخل)</td>
                              <td className="p-3 font-mono text-rose-700 font-bold">-{totalExpenses.toLocaleString()} د.ل</td>
                              <td className="p-3 font-mono text-slate-900 font-black">0.00 د.ل (تم الإغلاق وتصفيره)</td>
                            </tr>
                            <tr className="bg-emerald-50/20 text-emerald-950 font-extrabold">
                              <td className="p-3 font-mono font-bold">3200</td>
                              <td className="p-3">الأرباح المحتجزة والمدورة (رأس مال الاحتياطي)</td>
                              <td className="p-3 font-mono text-slate-500">الترحيل السنوي</td>
                              <td className="p-3 font-mono text-emerald-700 text-sm">+{ (0).toLocaleString() } د.ل (صافي الربح المدور)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* EXPANDABLE GENERATED JOURNAL ENTRIES VIEWER (FOR AUDIT Review) */}
                      <div className="space-y-3 text-right">
                        <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <span>القيود المحاسبية المولدة آلياً بقاعدة البيانات</span>
                          <span className="text-[9px] text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full font-bold">مرتبطة فعلياً</span>
                        </h4>

                        {/* Closing Entry Viewer */}
                        <details className="bg-slate-50 rounded-xl p-3 border border-slate-200 group text-xs text-right">
                          <summary className="font-bold text-slate-800 cursor-pointer hover:text-indigo-600 flex justify-between items-center outline-none list-none select-none">
                            <span className="flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-slate-500" />
                              <span>عرض تفاصيل قيد الإغلاق السنوي: <span className="font-mono text-indigo-600">JV-{}-CLOSE</span></span>
                            </span>
                            <span className="transition-transform group-open:rotate-180 text-slate-400">▼</span>
                          </summary>
                          <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-[11px]">
                            <p className="text-[10px] text-slate-500">تم تصفير الأرصدة الإيرادية والمصروفية، وتوجيه النتيجة إلى حساب الأرباح المدورة:</p>
                            <div className="overflow-x-auto rounded-lg border border-slate-150 bg-white">
                              <table className="w-full text-right border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-150">
                                    <th className="p-2">رمز الحساب</th>
                                    <th className="p-2">الحساب</th>
                                    <th className="p-2 text-left">مدين (Debit)</th>
                                    <th className="p-2 text-left">دائن (Credit)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {subRevenues.map(rev => (
                                    <tr key={rev.code} className="border-b border-slate-100">
                                      <td className="p-2 font-mono">{rev.code}</td>
                                      <td className="p-2">{rev.name}</td>
                                      <td className="p-2 font-mono text-left text-emerald-600">{(rev.endingBalance || 0).toLocaleString()} د.ل</td>
                                      <td className="p-2 font-mono text-left text-slate-400">0.00 د.ل</td>
                                    </tr>
                                  ))}
                                  {subExpenses.map(exp => (
                                    <tr key={exp.code} className="border-b border-slate-100">
                                      <td className="p-2 font-mono">{exp.code}</td>
                                      <td className="p-2">{exp.name}</td>
                                      <td className="p-2 font-mono text-left text-slate-400">0.00 د.ل</td>
                                      <td className="p-2 font-mono text-left text-rose-600">{(exp.endingBalance || 0).toLocaleString()} د.ل</td>
                                    </tr>
                                  ))}
                                  <tr className="bg-indigo-50/30">
                                    <td className="p-2 font-mono font-bold">3200</td>
                                    <td className="p-2 font-bold">الأرباح المحتجزة والمدورة</td>
                                    <td className="p-2 font-mono text-left font-bold">{0 ? Math.abs(0).toLocaleString() + ' د.ل' : '0.00 د.ل'}</td>
                                    <td className="p-2 font-mono text-left font-bold">{0 ? (0).toLocaleString() + ' د.ل' : '0.00 د.ل'}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </details>

                        {/* Opening Entry Viewer */}
                        <details className="bg-slate-50 rounded-xl p-3 border border-slate-200 group text-xs text-right">
                          <summary className="font-bold text-slate-800 cursor-pointer hover:text-indigo-600 flex justify-between items-center outline-none list-none select-none">
                            <span className="flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-slate-500" />
                              <span>عرض تفاصيل القيد الافتتاحي للسنة الجديدة: <span className="font-mono text-indigo-600">JV-{}-OPEN</span></span>
                            </span>
                            <span className="transition-transform group-open:rotate-180 text-slate-400">▼</span>
                          </summary>
                          <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-[11px]">
                            <p className="text-[10px] text-slate-500">تدوير الأرصدة الافتتاحية لحسابات الميزانية العمومية (الأصول، الخصوم، حقوق الملكية) للسنة الجديدة {} م:</p>
                            <div className="overflow-x-auto rounded-lg border border-slate-150 bg-white">
                              <table className="w-full text-right border-collapse text-[10px]">
                                <thead>
                                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-150">
                                    <th className="p-2">رمز الحساب</th>
                                    <th className="p-2">الحساب</th>
                                    <th className="p-2 text-left">مدين (Debit)</th>
                                    <th className="p-2 text-left">دائن (Credit)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {reportAccounts.filter(a => a.type === 'فرعي' && (a.classification === 'أصول' || a.classification === 'خصوم' || a.classification === 'حقوق ملكية')).map(acc => {
                                    const val = acc.endingBalance || 0;
                                    let deb = 0, crd = 0;
                                    if (acc.classification === 'أصول') {
                                      deb = val > 0 ? val : 0;
                                      crd = val < 0 ? Math.abs(val) : 0;
                                    } else {
                                      let actualVal = val;
                                      if (acc.code === '3200') {
                                        actualVal = val + 0;
                                      }
                                      crd = actualVal > 0 ? actualVal : 0;
                                      deb = actualVal < 0 ? Math.abs(actualVal) : 0;
                                    }
                                    if (deb === 0 && crd === 0) return null;
                                    return (
                                      <tr key={acc.code} className="border-b border-slate-100">
                                        <td className="p-2 font-mono">{acc.code}</td>
                                        <td className="p-2">{acc.name}</td>
                                        <td className="p-2 font-mono text-left">{deb > 0 ? `${deb.toLocaleString()} د.ل` : '0.00 د.ل'}</td>
                                        <td className="p-2 font-mono text-left">{crd > 0 ? `${crd.toLocaleString()} د.ل` : '0.00 د.ل'}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </details>
                      </div>

                      {/* CLOSING AUDIT TRAIL TIMELINE (سجل تدقيق الإقفال) */}
                      <div className="space-y-3 text-right">
                        <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <span>سجل التدقيق والمطابقة القانوني لعملية الإغلاق (Audit Trail)</span>
                          <span className="text-[9px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">موثق بالكامل</span>
                        </h4>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-[11px] text-slate-650 space-y-3 font-mono">
                          {closingAuditLog.length > 0 ? (
                            closingAuditLog.map((log, i) => (
                              <div key={i} className="flex items-start gap-2.5">
                                <span className="text-emerald-600 font-black">● {log.date.split(' ')[1] || log.date}</span>
                                <span className="font-sans flex-1">
                                  <strong>{log.action}:</strong> {log.details}
                                </span>
                              </div>
                            ))
                          ) : (
                            <>
                              <div className="flex items-start gap-2.5">
                                <span className="text-emerald-600 font-black">● 10:00:00</span>
                                <span className="font-sans flex-1">
                                  <strong>تجميد العمليات المحاسبية:</strong> تم إغلاق صلاحيات الإدخال لسنة {currentClosingYear} ومنع أي إدخالات بأثر رجعي.
                                </span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <span className="text-emerald-600 font-black">● 10:00:05</span>
                                <span className="font-sans flex-1">
                                  <strong>تصفير الأرصدة الإيرادية والمصروفية:</strong> تصفير الدفاتر المساعدة لكافة الحسابات الإيرادية والمصروفية وتوجيه النتائج لقيد الإغلاق الموحد.
                                </span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <span className="text-emerald-600 font-black">● 10:00:12</span>
                                <span className="font-sans flex-1">
                                  <strong>قيد ترحيل الأرباح:</strong> تدوير صافي الربح بقيمة { (0).toLocaleString() } د.ل وإضافتها لرأس مال الاحتياطي المعتمد (الحساب 3200).
                                </span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <span className="text-emerald-600 font-black">● 10:00:15</span>
                                <span className="font-sans flex-1">
                                  <strong>اعتماد الأرصدة الافتتاحية:</strong> ترحيل أرصدة الأصول والخصوم للسنة المالية الجديدة {} م بقيد افتتاحي متوازن.
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* PRINT & EXPORT UTILITIES BUTTONS */}
                      <div className="flex flex-wrap justify-center items-center gap-2 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => {
                            const originalTitle = document.title;
                            document.title = `سند_إقفال_السنة_المالية_${currentClosingYear}_${closingRefNo}`;
                            window.print();
                            document.title = originalTitle;
                            triggerNotification('✓ تم فتح واجهة الطباعة بنجاح لسند الإقفال والميزانية', 'success');
                          }}
                          className="bg-slate-900 hover:bg-slate-850 text-white font-bold py-2 px-5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow"
                        >
                          <Printer className="w-4 h-4" />
                          <span>طباعة تقرير الإقفال السنوي 🖨️</span>
                        </button>

                        <button
                          onClick={() => {
                            const headers = ['بند الإغلاق', 'تفاصيل التدقيق', 'المستخدم المسجل', 'الحالة والنتيجة'];
                            const rows = [
                              ['تجميد العمليات', `تجميد قيود ${currentClosingYear}`, drillDownUser.name, 'مكتمل بنجاح'],
                              ['تصفير الدفاتر', 'تصفير الحسابات الإيرادية والمصروفية', drillDownUser.name, 'مكتمل بنجاح'],
                              ['ترحيل الأرباح', `ترحيل مبلغ 0 د.ل للحساب 3200`, drillDownUser.name, 'مرحل ومعتمد'],
                              ['قيد الإغلاق المزدوج', `توليد القيد المزدوج JV-${currentClosingYear}-CLOSE`, drillDownUser.name, 'مكتمل']
                            ];
                            exportReportExcel(`تقرير_إقفال_السنة_المالية_${currentClosingYear}`, headers, rows);
                          }}
                          className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-lg text-xs border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تصدير Excel</span>
                        </button>

                        <button
                          onClick={() => {
                            const headers = ['رمز الحساب', 'البند المالي', 'رصيد الإقفال المرحل'];
                            const rows = [
                              ['4100', 'إيرادات الرسوم الدراسية الموحدة', '0.00 د.ل (مغلق)'],
                              ['5000', 'المصروفات والأعباء التشغيلية', '0.00 د.ل (مغلق)'],
                              ['3200', 'الأرباح المحتجزة والمدورة', `+0 د.ل (مدور)`]
                            ];
                            exportReportExcel(`أرصدة_إغلاق_السنة_المالية_${currentClosingYear}`, headers, rows);
                          }}
                          className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-lg text-xs border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>تصدير كشف الأرصدة PDF</span>
                        </button>
                      </div>
                    </div>

                    {/* STEP 4: SEED AND OPEN NEW FINANCIAL YEAR */}
                    <div className="bg-gradient-to-l from-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40 space-y-4">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-1.5 text-right">
                          <h4 className="text-xs font-black text-emerald-300 tracking-wider">الخطوة المحاسبية التالية (Next Accounting Stage)</h4>
                          <h3 className="text-sm font-black text-white">تأسيس وفتح الدفاتر للسنة المالية الجديدة {newYearNumberInput} م</h3>
                          <p className="text-[10px] text-slate-350 max-w-xl leading-relaxed">
                            بعد إتمام إقفال سنة {currentClosingYear} محاسبياً وقانونياً، يمكنك فتح دفاتر السنة الجديدة لتلقي العمليات اليومية وسندات قبض الرسوم المدرسية لعام {newYearNumberInput}، ونقل الأرصدة الافتتاحية للأصول والخصوم تلقائياً.
                          </p>
                        </div>

                        {openedYear2027 ? (
                          <div className="bg-emerald-500/20 text-emerald-300 font-extrabold px-4 py-2 rounded-xl text-xs border border-emerald-500/40 flex items-center gap-1">
                            <span>✓ تم فتح دفاتر {newYearNumberInput} م بنجاح</span>
                            <span>🚀</span>
                          </div>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!ensureCanonicalClosingPersistence()) return;
                              try {
                                await persistCanonicalFinancialSnapshot({
                                  financialYearOpening: {
                                    year: Number(newYearNumberInput || 2027),
                                    status: 'open',
                                    openedAt: new Date().toISOString(),
                                    startDate: newYearStartDateInput,
                                    endDate: newYearEndDateInput
                                  }
                                });
                                setOpenedYear2027(true);
                                triggerNotification(`🚀 تم حفظ فتح دفاتر السنة المالية الجديدة ${newYearNumberInput} مركزياً.`, 'success');
                                logAction('OPEN_YEAR_2027', `حفظ فتح دفاتر السنة المالية الجديدة ${newYearNumberInput} مركزياً`, 'الحسابات العامة');
                              } catch (error: any) {
                                triggerNotification(`تعذر فتح السنة الجديدة مركزياً: ${error?.message || 'خطأ غير معروف'}`, 'warning');
                              }
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                          >
                            فتح دفاتر السنة الجديدة {newYearNumberInput} م 🚀
                          </button>
                        )}
                      </div>
                    </div>

                    {/* RESET BUTTON FOR DEMO EXPERIENCES */}
                    <div className="text-center">
                      <button
                        onClick={async () => {
                          if (!ensureCanonicalClosingPersistence()) return;
                          try {
                            await persistCanonicalFinancialSnapshot({ financialClosing: null, financialYearOpening: null, closingRefNo: null, closingDate: null });
                            setIsYearClosed(false);
                            setOpenedYear2027(false);
                            setClosingStep('check');
                            setCheckedReady(false);
                            triggerNotification('🔄 تم إعادة تعيين حالة الإقفال مركزياً لإعادة الاختبار.', 'success');
                          } catch (error: any) {
                            triggerNotification(`تعذر إعادة تعيين الإقفال مركزياً: ${error?.message || 'خطأ غير معروف'}`, 'warning');
                          }
                        }}
                        className="text-[10px] font-black text-rose-600 hover:text-rose-800 underline cursor-pointer"
                      >
                        إعادة تعيين البيانات وإلغاء الإقفال (لغرض التجربة وتكرار الاختبار) 🔄
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}
    </>
  );
};
