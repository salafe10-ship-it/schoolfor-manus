import { Plus } from 'lucide-react';
import React from 'react';
import { AccountingContext } from '../../../components/GeneralLedgerPortal';
export const SuppliersLedgerTab = () => {
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
  formatCurrency, triggerNotification, canonicalFinancialStatus, canonicalFinancialWriteMode, persistCanonicalFinancialSnapshot
} = React.useContext(AccountingContext);

  const [isCreatingSupplier, setIsCreatingSupplier] = React.useState(false);
  const [supplierDraft, setSupplierDraft] = React.useState({ id: '', name: '', contact: '', category: '', accountCode: '', balance: '0' });

  const submitSupplier = async (event: React.FormEvent) => {
    event.preventDefault();
    if (canonicalFinancialStatus !== 'ready' || canonicalFinancialWriteMode !== 'ledger_ready') {
      triggerNotification('لا يمكن تسجيل المورد: سجل الموردين للقراءة فقط حتى اعتماد خدمة دفتر الأستاذ الكانونية.', 'warning');
      return;
    }
    const name = supplierDraft.name.trim();
    const accountCode = supplierDraft.accountCode.trim();
    const balance = Number(supplierDraft.balance || 0);
    const account = accounts.find(item => item.code === accountCode);
    if (!name || !accountCode || !account || !Number.isFinite(balance) || balance < 0) {
      triggerNotification('أدخل اسم المورد، وحسابًا دائنًا موثقًا، ورصيدًا غير سالب.', 'warning');
      return;
    }
    if (account.classification && account.classification !== 'خصوم') {
      triggerNotification('حساب المورد يجب أن يكون من تصنيف الخصوم.', 'warning');
      return;
    }
    const id = `SUP-${new Date().getFullYear()}-${Date.now().toString().slice(-7)}`;
    const supplier = {
      id,
      name,
      contact: supplierDraft.contact.trim(),
      category: supplierDraft.category.trim() || 'مورد عام',
      accountCode,
      balance,
      status: 'نشط',
      createdAt: new Date().toISOString()
    };
    try {
      await persistCanonicalFinancialSnapshot({ suppliers: [supplier, ...suppliers] });
      setSuppliers(previous => [supplier, ...previous]);
      setSupplierDraft({ id: '', name: '', contact: '', category: '', accountCode: '', balance: '0' });
      setIsCreatingSupplier(false);
      triggerNotification(`تم تسجيل المورد ${id} في المصدر المالي المركزي.`, 'success');
    } catch (error: any) {
      triggerNotification(error?.message || 'تعذر حفظ المورد مركزيًا؛ لم تتغير البيانات.', 'warning');
    }
  };

  return (
    <>
      {activeTab === 'suppliers' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">الأستاذ المساعد لحسابات الموردين والدائنين</h2>
                <p className="text-xs text-slate-500 mt-1">المصاريف الآجلة وتوطين دفعات توريد الكتب والخدمات اللوجستية</p>
              </div>

              <button 
                onClick={() => setIsCreatingSupplier(previous => !previous)}
                disabled={canonicalFinancialStatus !== 'ready' || canonicalFinancialWriteMode !== 'ledger_ready'}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>إدراج مورد جديد ببنك الموردين</span>
              </button>
            </div>

            {isCreatingSupplier && (
              <form onSubmit={submitSupplier} className="bg-white rounded-xl border border-indigo-100 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900">تسجيل مورد جديد</h3>
                    <p className="text-[10px] text-slate-500 mt-1">{canonicalFinancialWriteMode === 'ledger_ready' ? 'سيُحفظ المورد مع الحساب الدائن في المصدر المركزي فقط بعد اجتياز التحقق.' : 'المصدر الحالي snapshot للقراءة فقط؛ إضافة المورد متوقفة حتى اعتماد خدمة دفتر الأستاذ.'}</p>
                  </div>
                  <button type="button" onClick={() => setIsCreatingSupplier(false)} className="text-slate-500 hover:text-slate-900 font-bold">إغلاق</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="text-xs font-bold text-slate-700">اسم المورد
                    <input required value={supplierDraft.name} onChange={event => setSupplierDraft(previous => ({ ...previous, name: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5" />
                  </label>
                  <label className="text-xs font-bold text-slate-700">الهاتف / الاتصال
                    <input value={supplierDraft.contact} onChange={event => setSupplierDraft(previous => ({ ...previous, contact: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5" />
                  </label>
                  <label className="text-xs font-bold text-slate-700">التصنيف
                    <input value={supplierDraft.category} onChange={event => setSupplierDraft(previous => ({ ...previous, category: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5" placeholder="توريدات / خدمات" />
                  </label>
                  <label className="text-xs font-bold text-slate-700">الحساب الدائن
                    <select required value={supplierDraft.accountCode} onChange={event => setSupplierDraft(previous => ({ ...previous, accountCode: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5">
                      <option value="">اختر حساب خصوم موثقًا</option>
                      {accounts.filter(account => account.type === 'فرعي' && (!account.classification || account.classification === 'خصوم')).map(account => <option key={account.code} value={account.code}>{account.code} - {account.name}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-700">الرصيد الافتتاحي
                    <input type="number" min="0" value={supplierDraft.balance} onChange={event => setSupplierDraft(previous => ({ ...previous, balance: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 font-mono" />
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsCreatingSupplier(false)} className="rounded-lg bg-slate-100 px-4 py-2 font-bold text-slate-600">إلغاء</button>
                  <button type="submit" disabled={canonicalFinancialStatus !== 'ready' || canonicalFinancialWriteMode !== 'ledger_ready'} className="rounded-lg bg-indigo-600 px-5 py-2 font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300">{canonicalFinancialWriteMode === 'ledger_ready' ? 'حفظ المورد مركزيًا' : 'الإضافة غير متاحة — قراءة فقط'}</button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {suppliers.map(sup => (
                <div key={sup.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between h-44">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="p-1 px-2 bg-indigo-50 text-indigo-800 text-[9px] font-black rounded border border-indigo-100">{sup.category}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                        sup.status === 'نشط' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sup.status}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 mt-3 text-sm">{sup.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-1">تلفون الاتصال: {sup.contact}</p>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                    <span className="text-[10px] text-slate-500 font-bold">المستحقات غير المسددة:</span>
                    <span className="font-mono text-sm font-black text-slate-950" dir="ltr">{Number(sup.balance || 0).toLocaleString()} {currency}</span>
                  </div>
                </div>
              ))}
              {suppliers.length === 0 && (
                <div className="md:col-span-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500 font-bold">
                  لا توجد موردون موثقون في المصدر المالي المركزي حتى الآن.
                </div>
              )}
            </div>
          </div>
        )}
    </>
  );
};
