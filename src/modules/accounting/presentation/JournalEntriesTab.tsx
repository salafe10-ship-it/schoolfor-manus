import { AlertTriangle, ArrowDownLeft, ArrowUpRight, BookOpen, Calculator, Check, CheckCircle2, ChevronLeft, ChevronRight, Copy, CornerUpLeft, Download, Edit, Edit3, Eye, FileDown, FileSpreadsheet, FileText, Filter, Layers, List, Lock as LockIcon, LogOut, Maximize2, Minimize2, Paperclip, Play, Plus, Printer, Save, Search, Settings2, Share2, Table, Trash2, Upload, X } from 'lucide-react';
import React from 'react';
import { AccountingContext } from '../../../components/GeneralLedgerPortal';
export const JournalEntriesTab = () => {
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
  showAddJVModal, setShowAddJVModal, newJV, setNewJV, selectedJvId, setSelectedJvId, jvTableSearch, setJvTableSearch, jvColWidths, setJvColWidths, jvSearchFilters, setJvSearchFilters,
  isJvFullscreen, setIsJvFullscreen,
  jvEditMode, setJvEditMode,
  activeJvTab, setActiveJvTab,
  showJvSearchOverlay, setShowJvSearchOverlay,
  showJvPrintModal, setShowJvPrintModal,
  selectedJvPrintTemplate, setSelectedJvPrintTemplate,
  copiedJvLine, setCopiedJvLine,
  jvFocusedRowIndex, setJvFocusedRowIndex,
  activeJvState, setActiveJvState,
  jvAuditTrail, setJvAuditTrail,
  jvAttachmentsList, setJvAttachmentsList,
  jvTableMaximized, setJvTableMaximized,
  receiptVouchers, setReceiptVouchers,
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
  formatCurrency,
  triggerNotification, validateJvIntegrity, handlePostJv, handleUnpostJv, handleDeleteJv, handleSaveJv,
  canonicalFinancialWriteMode
} = React.useContext(AccountingContext);

  const [jvPage, setJvPage] = React.useState(1);
  const JV_PAGE_SIZE = 15;
  const journalWritesAreCanonical = canonicalFinancialWriteMode === 'ledger_ready' || canonicalFinancialWriteMode === 'erp_integrated';
  const journalWritesAreAvailable = journalWritesAreCanonical || canonicalFinancialWriteMode === 'snapshot_write';
  const isPostedJournalStatus = (status: unknown) => ['مرحل', 'مرحّل', 'مُرحّل', 'posted', 'approved', 'معتمد'].includes(String(status || '').trim().toLowerCase());
  const journalWriteBlockedLabel = canonicalFinancialWriteMode === 'snapshot_write'
    ? 'حفظ مركزي UAT — غير معتمد كترحيل GL'
    : 'قراءة فقط';
  const guardJournalWrite = (actionName: string) => {
    if (journalWritesAreAvailable) return true;
    triggerNotification(`تعذر تنفيذ ${actionName}: القيود للقراءة فقط حتى اعتماد دفتر الأستاذ الكانوني.`, 'warning');
    return false;
  };


const handlePrepareNewJv = () => {
    if (!guardJournalWrite('إنشاء مسودة القيد')) return;
    let nextNum = journalEntries.length + 1;
    let nextId = `JV-2026-${String(nextNum).padStart(3, '0')}`;
    while (journalEntries.some(j => j.id === nextId)) {
      nextNum++;
      nextId = `JV-2026-${String(nextNum).padStart(3, '0')}`;
    }
    
    const newState = {
      id: nextId,
      date: new Date().toISOString().split('T')[0],
      description: '',
      type: 'بسيط',
      status: 'مسودة',
      debitTotal: 0,
      creditTotal: 0,
      createdByUser: 'سليمان غازي',
      createdAt: new Date().toLocaleString('ar-LY'),
      updatedAt: new Date().toLocaleString('ar-LY'),
      lines: [
        { id: 'l-1', accountCode: '1101', accountName: 'صندوق النقدية والخزينة الموحدة', description: '', debit: 0, credit: 0, costCenter: 'primary' },
        { id: 'l-2', accountCode: '4101', accountName: 'إيرادات الرسوم الدراسية الموحدة', description: '', debit: 0, credit: 0, costCenter: 'primary' }
      ],
      attachments: [] as string[]
    };
    setActiveJvState(newState);
    setJvEditMode('create');
    setActiveJvTab('simple');
    setSelectedJvId(nextId);
    setJvFocusedRowIndex(-1);
    setIsJvFullscreen(true);
    addJvAuditTrail(nextId, 'إنشاء مسودة قيد جديدة', 'سليمان غازي', `بدء صياغة قيد مالي جديد ${nextId}`);
    triggerNotification(`✓ تم فتح قيد مسودة جديد: ${nextId}`, 'info');
  };

const handleEditJv = (jvId: string) => {
    const jv = journalEntries.find(j => j.id === jvId);
    if (jv) {
      const parsedLines = jv.lines ? [...jv.lines] : [
        { id: 'l-1', accountCode: '1101', accountName: 'صندوق النقدية والخزينة الموحدة', description: jv.description, debit: jv.debitTotal, credit: 0, costCenter: 'primary' },
        { id: 'l-2', accountCode: '4101', accountName: 'إيرادات الرسوم الدراسية الموحدة', description: jv.description, debit: 0, credit: jv.creditTotal, costCenter: 'primary' }
      ];
      
      setActiveJvState({
        ...jv,
        lines: parsedLines.map((l: any, i: number) => ({
          ...l,
          id: l.id || `l-${i}`
        }))
      });
      setJvEditMode('view');
      setSelectedJvId(jvId);
      setActiveJvTab(jv.type === 'بسيط' ? 'simple' : 'compound');
      setIsJvFullscreen(true);
      setJvFocusedRowIndex(-1);
      addJvAuditTrail(jvId, 'عرض القيد', 'سليمان غازي', `عرض تفاصيل القيد رقم ${jvId}`);
    }
  };

const addJvAuditTrail = (jvId: string, action: string, user: string, details: string) => {
    const newAudit = {
      id: `A-${Math.floor(Math.random() * 8999) + 1000}`,
      jvId,
      action,
      user,
      timestamp: new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('ar-LY'),
      details
    };
    setJvAuditTrail(prev => [newAudit, ...prev]);
  };

const handleJvFormChange = (field: string, value: any) => {
    setActiveJvState((prev: any) => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toLocaleString('ar-LY')
    }));
  };

const handleJvLineChange = (lineId: string, field: string, value: any) => {
    setActiveJvState((prev: any) => {
      const updatedLines = prev.lines.map((l: any) => {
        if (l.id === lineId) {
          const updatedLine = { ...l, [field]: value };
          if (field === 'accountCode') {
            const acc = accounts.find(a => a.code === value);
            updatedLine.accountName = acc ? acc.nameAr : '';
          }
          return updatedLine;
        }
        return l;
      });
      return {
        ...prev,
        lines: updatedLines,
        updatedAt: new Date().toLocaleString('ar-LY')
      };
    });
  };

const handleAddJvLine = () => {
    setActiveJvState((prev: any) => ({
      ...prev,
      lines: [
        ...prev.lines,
        { id: `l-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, accountCode: '', accountName: '', description: '', debit: 0, credit: 0, costCenter: 'primary' }
      ]
    }));
  };

const handleRemoveJvLine = (lineId: string) => {
    setActiveJvState((prev: any) => {
      if (prev.lines.length <= 1) {
        triggerNotification('⚠️ يجب أن يحتوي القيد على سطر واحد على الأقل', 'warning');
        return prev;
      }
      return {
        ...prev,
        lines: prev.lines.filter((l: any) => l.id !== lineId)
      };
    });
  };

const handleDuplicateJvLine = (index: number) => {
    setActiveJvState((prev: any) => {
      const newLines = [...prev.lines];
      const newLine = { id: `l-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, accountCode: '', accountName: '', description: '', debit: 0, credit: 0, costCenter: 'primary' };
      newLines.splice(index + 1, 0, newLine);
      return {
        ...prev,
        lines: newLines
      };
    });
  };

const handleCopyJvLine = (line: any) => {
    setCopiedJvLine({ ...line, id: undefined });
    triggerNotification('📋 تم نسخ السطر الحالي بنجاح', 'success');
  };

const handlePasteJvLine = (index: number) => {
    if (!copiedJvLine) {
      triggerNotification('⚠️ لم يتم نسخ أي سطر مسبقاً', 'warning');
      return;
    }
    setActiveJvState((prev: any) => {
      const newLines = [...prev.lines];
      newLines[index] = {
        ...copiedJvLine,
        id: `l-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
      };
      return {
        ...prev,
        lines: newLines
      };
    });
    triggerNotification('📋 تم لصق بيانات السطر بنجاح', 'success');
  };

const handleMoveJvLine = (index: number, direction: 'up' | 'down') => {
    setActiveJvState((prev: any) => {
      const newLines = [...prev.lines];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newLines.length) return prev;
      
      const temp = newLines[index];
      newLines[index] = newLines[targetIndex];
      newLines[targetIndex] = temp;

      return {
        ...prev,
        lines: newLines
      };
    });
  };

const handleApproveJv = (jvId: string) => {
    if (!guardJournalWrite('اعتماد القيد')) return;
    const jv = journalEntries.find(j => j.id === jvId);
    if (!jv) return;

    // تشغيل الرقابة الجنائية والمالية الشاملة قبل الاعتماد
    const auditResult = validateJvIntegrity(jv);
    if (!auditResult.isValid) {
      triggerNotification(`❌ فشل الاعتماد: ${auditResult.error}`, 'warning');
      return;
    }

    setJournalEntries(prev => prev.map(j => j.id === jvId ? { ...j, status: 'معتمد' } : j));
    addJvAuditTrail(jvId, 'اعتماد قيد', 'سليمان غازي', `اعتماد قيد تسوية الميزانية بموجب الرقابة المالية`);
    triggerNotification(`🔒 تم اعتماد القيد ${jvId} رسمياً وحظر تحويره أو حذفه`, 'success');
    setActiveJvState((prev: any) => ({ ...prev, status: 'معتمد' }));
  };

const handleCloneJv = (jvId: string) => {
    if (!guardJournalWrite('نسخ القيد')) return;
    const jv = journalEntries.find(j => j.id === jvId);
    if (!jv) return;

    let nextNum = journalEntries.length + 1;
    let nextId = `JV-2026-${String(nextNum).padStart(3, '0')}`;
    while (journalEntries.some(j => j.id === nextId)) {
      nextNum++;
      nextId = `JV-2026-${String(nextNum).padStart(3, '0')}`;
    }

    const cloned = {
      ...jv,
      id: nextId,
      date: new Date().toISOString().split('T')[0],
      status: 'مسودة',
      description: `نسخة من قيد: ${jv.description}`,
      createdByUser: 'سليمان غازي',
      createdAt: new Date().toLocaleString('ar-LY'),
      updatedAt: new Date().toLocaleString('ar-LY'),
      lines: (jv.lines || []).map((l, i) => ({ ...l, id: `cl-${i}` }))
    };

    setActiveJvState(cloned);
    setJvEditMode('create');
    setSelectedJvId(nextId);
    setActiveJvTab(jv.type === 'بسيط' ? 'simple' : 'compound');
    triggerNotification(`📋 تم استنساخ القيد ${jvId} إلى مسودة جديدة برقم ${nextId}`, 'info');
  };

const handleExportJv = async (format: string, jvToExport: any = activeJvState) => {
    const title = `سند قيد تسوية مالي - ${jvToExport.id}`;
    const headerDetails = `رقم القيد: ${jvToExport.id} | التاريخ: ${jvToExport.date} | الحالة: ${jvToExport.status}`;
    
    if (format === 'csv') {
      let csv = "\uFEFF"; // UTF-8 BOM
      csv += "رقم الحساب,اسم بند الحساب,البيان والشرط,مدين,دائن,مركز التكلفة\n";
      jvToExport.lines.forEach((l: any) => {
        csv += `${l.accountCode},"${l.accountName}","${l.description || jvToExport.description}",${l.debit},${l.credit},${l.costCenter}\n`;
      });
      csv += `,,,${jvToExport.debitTotal},${jvToExport.creditTotal},\n`;
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `JV_Export_${jvToExport.id}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerNotification('✓ تم تصدير القيد بصيغة CSV بنجاح', 'success');
    } else if (format === 'xlsx') {
      const { writeXlsxBuffer } = await import('../../../utils/ExcelWorkbookUtils');
      const buffer = await writeXlsxBuffer([{
        name: 'القيد',
        headers: ['رقم الحساب', 'اسم بند الحساب', 'البيان والشرط', 'مدين', 'دائن', 'مركز التكلفة'],
        rows: jvToExport.lines.map((line: any) => [
          line.accountCode,
          line.accountName,
          line.description || jvToExport.description,
          line.debit,
          line.credit,
          line.costCenter,
        ]),
        columnWidths: [16, 28, 36, 16, 16, 20],
      }, {
        name: 'الملخص',
        headers: ['الحقل', 'القيمة'],
        rows: [
          ['رقم القيد', jvToExport.id],
          ['التاريخ', jvToExport.date],
          ['الحالة', jvToExport.status],
          ['الإجمالي المدين', jvToExport.debitTotal],
          ['الإجمالي الدائن', jvToExport.creditTotal],
        ],
        columnWidths: [24, 32],
      }]);
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `JV_Export_${jvToExport.id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerNotification('✓ تم تصدير القيد بصيغة XLSX حقيقية وآمنة بنجاح', 'success');
    } else if (format === 'doc') {
      const html = `
        <html>
        <head><meta charset="utf-8" /></head>
        <body style="direction: rtl; font-family: Times New Roman, serif; padding: 20px;">
          <h1 style="text-align: center;">مجموعة مدارس الأسرة الحديثة التعليمية</h1>
          <h2 style="text-align: center; color: #4f46e5;">سند قيد اليومية العامة الموحد</h2>
          <hr />
          <p><b>رقم القيد المعتمد:</b> ${jvToExport.id}</p>
          <p><b>التاريخ مالي:</b> ${jvToExport.date}</p>
          <p><b>البيان العام:</b> ${jvToExport.description}</p>
          <p><b>الحالة والمركز:</b> ${jvToExport.status}</p>
          <p><b>منشئ المستخلص:</b> ${jvToExport.createdByUser}</p>
          <br />
          <table border="1" cellpadding="5" style="width: 100%; border-collapse: collapse; text-align: right;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th>رقم الحساب</th>
                <th>اسم بند الحساب</th>
                <th>البيان التحليلي</th>
                <th>الجانب المدين</th>
                <th>الجانب الدائن</th>
                <th>مركز التكلفة</th>
              </tr>
            </thead>
            <tbody>
              ${jvToExport.lines.map((l: any) => `
                <tr>
                  <td>${l.accountCode}</td>
                  <td>${l.accountName}</td>
                  <td>${l.description || jvToExport.description}</td>
                  <td>${l.debit.toLocaleString()} د.ل</td>
                  <td>${l.credit.toLocaleString()} د.ل</td>
                  <td>${l.costCenter}</td>
                </tr>
              `).join('')}
              <tr style="background-color: #e5e7eb; font-weight: bold;">
                <td colspan="3" style="text-align: center;">الإجمالي العام لقيد التسوية</td>
                <td>${jvToExport.debitTotal.toLocaleString()} د.ل</td>
                <td>${jvToExport.creditTotal.toLocaleString()} د.ل</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
          <br /><br />
          <table style="width: 100%; text-align: center;">
            <tr>
              <td><b>أعده:</b><br />سليمان غازي</td>
              <td><b>راجعته الرقابة المباشرة:</b><br />قسم الحسابات العامة</td>
              <td><b>اعتمد الميزانية للفرع:</b><br />المدير المالي والمفوض</td>
            </tr>
          </table>
        </body>
        </html>
      `;
      const blob = new Blob([html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `JV_Export_${jvToExport.id}.doc`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerNotification('✓ تم تصدير القيد بصيغة Word بنجاح', 'success');
    }
  };

const handleImportJvLinesFromCSV = (csvText: string) => {
    try {
      const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length < 1) {
        triggerNotification('⚠️ النص الملصق فارغ أو غير متوافق', 'warning');
        return;
      }
      
      const importedLines: any[] = [];
      lines.forEach((line, index) => {
        const cols = line.split(',').map(c => c.trim());
        if (cols.length >= 3) {
          const code = cols[0];
          const acc = accounts.find(a => a.code === code);
          const accName = acc ? acc.nameAr : (cols[1] || 'بند مستورد');
          const desc = cols[2] || '';
          const debit = parseFloat(cols[3]) || 0;
          const credit = parseFloat(cols[4]) || 0;
          const costCenter = cols[5] || 'primary';
          
          importedLines.push({
            id: `l-${Date.now()}-${index}`,
            accountCode: code,
            accountName: accName,
            description: desc,
            debit,
            credit,
            costCenter
          });
        }
      });

      if (importedLines.length > 0) {
        setActiveJvState((prev: any) => ({
          ...prev,
          lines: importedLines,
          type: 'مركب'
        }));
        setActiveJvTab('compound');
        triggerNotification(`✓ تم استيراد عدد (${importedLines.length}) أسطر بنجاح لجدول القيد المركب`, 'success');
      } else {
        triggerNotification('⚠️ لم نتمكن من تحليل الأسطر الملصقة، يرجى التحقق من الفواصل', 'warning');
      }
    } catch (err: any) {
      triggerNotification('❌ خطأ في عملية الاستيراد المجدولة', 'warning');
    }
  };


  return (
    <>
              {activeTab === 'journal_entries' && (
          <div className="space-y-6 animate-fade-in text-xs relative">
            
            {/* FULLSCREEN ERP WORKSPACE */}
            {isJvFullscreen && activeJvState && (
              <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none overflow-hidden" dir="rtl">
                <div className="w-[96%] xl:w-[94%] h-[95vh] max-h-[960px] bg-[#f8fafc] text-slate-800 flex flex-col rounded-2xl shadow-2xl border border-slate-300 overflow-hidden">
                  
                  {/* 1. HEADER TITLE BAR */}
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 px-5 py-3.5 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-600/35 text-indigo-200 p-2 rounded-lg border border-indigo-500/35 shadow-sm">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h1 className="text-sm font-extrabold tracking-tight text-white">نظام قيود اليومية العامة والأستاذ العام (ERP General Ledger)</h1>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-300">
                          <span className="font-bold text-slate-400">رقم القيد الفرعي:</span>
                          <b className="font-mono text-amber-400 font-extrabold text-[12px]">{activeJvState.id}</b>
                          <span className="text-slate-600">|</span>
                          <span className="font-bold text-slate-400">تصنيف التسوية:</span>
                          <b className="text-cyan-300 font-black">{activeJvTab === 'simple' ? 'قيد ثنائي بسيط' : 'قيد تسوية مركب متعدد الأطراف'}</b>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Status Badges */}
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black border flex items-center gap-1.5 shadow-sm ${
                        activeJvState.status === 'معتمد' ? 'bg-blue-950 text-blue-200 border-blue-800' :
                        activeJvState.status === 'مرحل' ? 'bg-emerald-950 text-emerald-200 border-emerald-800' :
                        'bg-amber-950 text-amber-200 border-amber-800'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          activeJvState.status === 'معتمد' ? 'bg-blue-400 animate-pulse' :
                          activeJvState.status === 'مرحل' ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}></span>
                        <span>حالة السند: {activeJvState.status}</span>
                      </span>

                      <button 
                        onClick={() => setIsJvFullscreen(false)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-1.5 rounded-lg transition border border-slate-700"
                        title="خروج من الشاشة الكاملة (Esc)"
                      >
                        <Minimize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                {/* 2. RIBBON TOOLBAR */}
                <div className="bg-[#f8fafc] border-b border-slate-200/80 p-2.5 px-4 flex items-center gap-3 flex-wrap justify-between shadow-sm">
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Action Group 1: New / Save / Edit */}
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
                      <button
                        onClick={handlePrepareNewJv}
                        disabled={!journalWritesAreAvailable}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 transition font-semibold text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
                        title={journalWritesAreAvailable ? journalWritesAreCanonical ? 'قيد مالي جديد' : 'قيد جديد سيُحفظ في snapshot UAT' : 'إنشاء القيد متوقف — دفتر الأستاذ للقراءة فقط'}
                      >
                        <Plus className="w-4 h-4 text-indigo-600" />
                        <span>{journalWritesAreAvailable ? journalWritesAreCanonical ? 'جديد' : 'جديد — حفظ مركزي UAT' : 'جديد — قراءة فقط'}</span>
                      </button>

                      <button
                        onClick={handleSaveJv}
                        disabled={activeJvState.status === 'معتمد' || !journalWritesAreAvailable}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-slate-700 transition font-semibold text-[11px] ${
                          activeJvState.status === 'معتمد' || !journalWritesAreAvailable ? 'opacity-30 cursor-not-allowed' : 'hover:bg-emerald-50 hover:text-emerald-600'
                        }`}
                        title={journalWritesAreAvailable ? 'حفظ القيد مركزياً' : 'الحفظ متوقف — دفتر الأستاذ للقراءة فقط'}
                      >
                        <Save className="w-4 h-4 text-emerald-600" />
                        <span>حفظ</span>
                      </button>

                      <button
                        onClick={() => {
                          if (activeJvState.status === 'معتمد') {
                            triggerNotification('❌ لا يمكن تعديل قيد معتمد ومقفل ماليًا', 'warning');
                          } else {
                            setJvEditMode('edit');
                            triggerNotification('✏️ تم تمكين التعديل والتحرير على حقول السند', 'info');
                          }
                        }}
                        disabled={activeJvState.status === 'معتمد' || !journalWritesAreAvailable}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-slate-700 transition font-semibold text-[11px] ${
                          activeJvState.status === 'معتمد' || !journalWritesAreAvailable ? 'opacity-30 cursor-not-allowed' : 'hover:bg-sky-50 hover:text-sky-600'
                        }`}
                        title="تعديل القيد المالي"
                      >
                        <Edit3 className="w-4 h-4 text-sky-600" />
                        <span>تعديل</span>
                      </button>
                    </div>

                    {/* Action Group 2: Management */}
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
                      <button
                        onClick={() => handleDeleteJv(activeJvState.id)}
                        disabled={!journalWritesAreAvailable}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-rose-50 hover:text-rose-600 text-slate-700 transition font-semibold text-[11px]"
                        title={journalWritesAreAvailable ? 'حذف القيد من المصدر المركزي' : 'الحذف متوقف — دفتر الأستاذ للقراءة فقط'}
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>حذف</span>
                      </button>

                      <button
                        onClick={() => handleCloneJv(activeJvState.id)}
                        disabled={!journalWritesAreAvailable}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-indigo-50/50 hover:text-indigo-600 text-slate-700 transition font-semibold text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
                        title={journalWritesAreAvailable ? 'استنساخ القيد الحالي' : 'نسخ القيد متوقف — دفتر الأستاذ للقراءة فقط'}
                      >
                        <Copy className="w-4 h-4 text-indigo-500" />
                        <span>نسخ قيد</span>
                      </button>

                      <button
                        onClick={() => setShowJvSearchOverlay(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-blue-50 hover:text-blue-600 text-slate-700 transition font-semibold text-[11px]"
                        title="بحث متقدم بالقيود"
                      >
                        <Search className="w-4 h-4 text-blue-500" />
                        <span>بحث قيود</span>
                      </button>
                    </div>

                    {/* Action Group 3: Printing & Exports */}
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
                      <button
                        onClick={() => {
                          setSelectedJvPrintTemplate('standard');
                          setShowJvPrintModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-100 hover:text-sky-600 text-slate-700 transition font-semibold text-[11px]"
                        title="طباعة السند"
                      >
                        <Printer className="w-4 h-4 text-slate-500" />
                        <span>طباعة</span>
                      </button>

                      <div className="relative group">
                        <button
                          type="button"
                          aria-haspopup="menu"
                          aria-label="فتح خيارات تصدير القيود"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-100 hover:text-emerald-600 text-slate-700 transition font-semibold text-[11px]"
                          title="تصدير المستند"
                        >
                          <Download className="w-4 h-4 text-slate-500" />
                          <span>تصدير</span>
                        </button>
                        <div role="menu" className="hidden group-hover:block group-focus-within:block absolute top-8 right-0 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-36 z-50 text-[11px]">
                          <button onClick={() => void handleExportJv('xlsx')} className="w-full text-right px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ملف Excel (.xlsx)</span>
                          </button>
                          <button onClick={() => handleExportJv('csv')} className="w-full text-right px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold">
                            <FileText className="w-3.5 h-3.5 text-cyan-600" />
                            <span>ملف CSV (.csv)</span>
                          </button>
                          <button onClick={() => handleExportJv('doc')} className="w-full text-right px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>ملف Word (.doc)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action Group 4: Ledger Controls */}
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
                      <button
                        onClick={() => handlePostJv(activeJvState.id)}
                        disabled={activeJvState.status === 'مرحل' || activeJvState.status === 'معتمد' || !journalWritesAreAvailable}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-slate-700 transition font-semibold text-[11px] ${
                          activeJvState.status === 'مرحل' || activeJvState.status === 'معتمد' || !journalWritesAreAvailable ? 'opacity-30 cursor-not-allowed' : 'hover:bg-emerald-50 hover:text-emerald-600'
                        }`}
                        title={journalWritesAreAvailable ? journalWritesAreCanonical ? 'ترحيل القيد وربطه بالأستاذ العام' : 'حفظ حالة القيد في snapshot UAT — غير مرحّل في GL' : 'الترحيل متوقف — دفتر الأستاذ للقراءة فقط'}
                      >
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                        <span>ترحيل</span>
                      </button>

                      <button
                        onClick={() => handleUnpostJv(activeJvState.id)}
                        disabled={activeJvState.status !== 'مرحل' || !journalWritesAreAvailable}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-slate-700 transition font-semibold text-[11px] ${
                          activeJvState.status !== 'مرحل' || !journalWritesAreAvailable ? 'opacity-30 cursor-not-allowed' : 'hover:bg-amber-50 hover:text-amber-600'
                        }`}
                        title={journalWritesAreAvailable ? 'إلغاء الترحيل وإعادته لمسودة' : 'إلغاء الترحيل متوقف — دفتر الأستاذ للقراءة فقط'}
                      >
                        <ArrowDownLeft className="w-4 h-4 text-amber-600" />
                        <span>إلغاء ترحيل</span>
                      </button>

                      <button
                        onClick={() => handleApproveJv(activeJvState.id)}
                        disabled={activeJvState.status === 'معتمد' || !journalWritesAreAvailable}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-slate-700 transition font-semibold text-[11px] ${
                          activeJvState.status === 'معتمد' || !journalWritesAreAvailable ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-50 hover:text-blue-600'
                        }`}
                        title={journalWritesAreAvailable ? journalWritesAreCanonical ? 'اعتماد القيد نهائياً' : 'اعتماد حالة القيد داخل snapshot UAT — غير نهائي للـ GL' : 'الاعتماد متوقف — دفتر الأستاذ للقراءة فقط'}
                      >
                        <LockIcon className="w-4 h-4 text-blue-600" />
                        <span>اعتماد مالي</span>
                      </button>
                    </div>

                    {/* Table Maximization Control */}
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
                      <button
                        onClick={() => setJvTableMaximized(!jvTableMaximized)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-semibold text-[11px] ${
                          jvTableMaximized ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                        title={jvTableMaximized ? "تصغير الجدول للمظهر المدمج" : "تكبير الجدول لكامل المساحة"}
                      >
                        <Maximize2 className="w-4 h-4 text-indigo-600" />
                        <span>{jvTableMaximized ? "تصغير الجدول ⛶" : "تكبير الجدول ⛶"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Exit */}
                  <button
                    onClick={() => setIsJvFullscreen(false)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition font-semibold text-[11px] border border-transparent hover:border-slate-300 mr-auto"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>خروج</span>
                  </button>
                </div>

                {/* 3. WORKSPACE CORE BODY */}
                <div className="flex-1 overflow-y-auto p-2 bg-[#f8fafc] flex flex-col gap-1.5">
                  
                  {/* Metadata Input Section */}
                  <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-wrap items-center gap-5 text-xs text-slate-700 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-500">رقم القيد:</span>
                      <input 
                        type="text" 
                        value={activeJvState.id}
                        disabled
                        className="w-24 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg px-2.5 py-1.5 font-mono font-bold text-xs text-center" 
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-500">التاريخ:</span>
                      <input 
                        type="date" 
                        value={activeJvState.date}
                        disabled={jvEditMode === 'view' || activeJvState.status === 'معتمد'}
                        onChange={(e) => handleJvFormChange('date', e.target.value)}
                        className="w-36 bg-white border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 focus:outline-none transition-all" 
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-500">نوع القيد:</span>
                      <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs border border-slate-200 font-extrabold">
                        {activeJvTab === 'simple' ? 'ثنائي بسيط' : 'تسوية مركب'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-500">العملة:</span>
                      <input 
                        type="text" 
                        value="دينار ليبي (د.ل)"
                        disabled
                        className="w-32 bg-slate-100 border border-slate-200 text-slate-500 text-center rounded-lg px-2.5 py-1.5 text-xs font-bold" 
                      />
                    </div>

                    <div className="flex-1 flex items-center gap-2 min-w-[280px]">
                      <span className="font-extrabold text-slate-500 whitespace-nowrap">البيان العام:</span>
                      <input 
                        type="text" 
                        placeholder="أدخل الشرح التفصيلي العام للقيد المحاسبي المبرر لعملية التسوية..."
                        value={activeJvState.description}
                        disabled={jvEditMode === 'view' || activeJvState.status === 'معتمد'}
                        onChange={(e) => handleJvFormChange('description', e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 focus:outline-none placeholder-slate-400 transition-all" 
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-500">المدرسة:</span>
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-extrabold">
                        مجمع المدارس الموحد
                      </span>
                    </div>
                  </div>

                  {/* Tabs Selection */}
                  <div className="flex border-b border-slate-200 gap-1.5 mt-2">
                    <button
                      onClick={() => {
                        setActiveJvTab('simple');
                        handleJvFormChange('type', 'بسيط');
                      }}
                      className={`px-5 py-2 rounded-t-lg font-extrabold text-xs transition duration-150 border-t border-x ${
                        activeJvTab === 'simple' 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                          : 'bg-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-200 border-slate-200/60'
                      }`}
                    >
                      التبويب الأول: قيد تسوية ثنائي (بسيط)
                    </button>
                    <button
                      onClick={() => {
                        setActiveJvTab('compound');
                        handleJvFormChange('type', 'مركب');
                      }}
                      className={`px-5 py-2 rounded-t-lg font-extrabold text-xs transition duration-150 border-t border-x ${
                        activeJvTab === 'compound' 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                          : 'bg-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-200 border-slate-200/60'
                      }`}
                    >
                      التبويب الثاني: قيد تسوية متعدد الأطراف (مركب)
                    </button>
                  </div>

                  {/* TABS CONTAINER */}
                  <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm min-h-[220px]">
                    
                    {/* TAB 1: SIMPLE ENTRY */}
                    {activeJvTab === 'simple' && !jvTableMaximized && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Side A: Debit Card */}
                          <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 space-y-3 shadow-xs">
                            <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                              <span className="text-emerald-900 font-black text-xs">حساب الطرف المدين (من حـ/)</span>
                              <span className="bg-emerald-100 text-[10px] text-emerald-800 px-2.5 py-0.5 rounded-full font-black font-mono">DEBIT SIDE</span>
                            </div>
                            
                            <div>
                              <label className="block text-[11px] text-slate-500 mb-1.5 font-bold">اختيار البند المالي الفرعي</label>
                              <select
                                value={activeJvState.lines[0]?.accountCode || '1101'}
                                disabled={jvEditMode === 'view' || activeJvState.status === 'معتمد'}
                                onChange={(e) => handleJvLineChange('l-1', 'accountCode', e.target.value)}
                                className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                              >
                                {accounts.filter(acc => acc.type === 'فرعي').map(acc => (
                                  <option key={acc.code} value={acc.code}>{acc.code} - {acc.nameAr}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-500 mb-1.5 font-bold">قيمة المبلغ المالي (بالدينار الليبي)</label>
                              <input 
                                type="number" 
                                placeholder="0.00"
                                value={activeJvState.lines[0]?.debit || ''}
                                disabled={jvEditMode === 'view' || activeJvState.status === 'معتمد'}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setActiveJvState((prev: any) => {
                                    const l1 = { ...prev.lines[0], debit: val, credit: 0 };
                                    const l2 = { ...prev.lines[1], debit: 0, credit: val };
                                    return {
                                      ...prev,
                                      debitTotal: val,
                                      creditTotal: val,
                                      lines: [l1, l2]
                                    };
                                  });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-emerald-800 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all" 
                              />
                            </div>
                          </div>

                          {/* Side B: Credit Card */}
                          <div className="bg-rose-50/30 border border-rose-100 rounded-xl p-4 space-y-3 shadow-xs">
                            <div className="flex justify-between items-center pb-2 border-b border-rose-100">
                              <span className="text-rose-950 font-black text-xs">حساب الطرف الدائن (إلى حـ/)</span>
                              <span className="bg-rose-100 text-[10px] text-rose-800 px-2.5 py-0.5 rounded-full font-black font-mono">CREDIT SIDE</span>
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-500 mb-1.5 font-bold">اختيار البند المالي الفرعي</label>
                              <select
                                value={activeJvState.lines[1]?.accountCode || '4101'}
                                disabled={jvEditMode === 'view' || activeJvState.status === 'معتمد'}
                                onChange={(e) => handleJvLineChange('l-2', 'accountCode', e.target.value)}
                                className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                              >
                                {accounts.filter(acc => acc.type === 'فرعي').map(acc => (
                                  <option key={acc.code} value={acc.code}>{acc.code} - {acc.nameAr}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-500 mb-1.5 font-bold">قيمة المبلغ المالي (بالدينار الليبي)</label>
                              <input 
                                type="number" 
                                placeholder="0.00"
                                value={activeJvState.lines[1]?.credit || ''}
                                disabled
                                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-rose-800 font-mono font-bold text-xs cursor-not-allowed border-dashed" 
                              />
                            </div>
                          </div>
                        </div>

                        {/* Cost Center / File Drag Card */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-center space-y-2">
                            <label className="block text-[11px] text-slate-600 font-extrabold">فرع مركز التكلفة الأساسي (الفصل المالي)</label>
                            <select
                              value={activeJvState.lines[0]?.costCenter || 'primary'}
                              disabled={jvEditMode === 'view' || activeJvState.status === 'معتمد'}
                              onChange={(e) => {
                                const cc = e.target.value;
                                handleJvLineChange('l-1', 'costCenter', cc);
                                handleJvLineChange('l-2', 'costCenter', cc);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            >
                              <option value="kindergarten">مراكز الروضة والتمهيدي 🎨</option>
                              <option value="primary">مراكز التعليم الأساسي والابتدائي 🎒</option>
                              <option value="middle">مراكز التعليم الإعدادي والمتوسط 📚</option>
                              <option value="secondary">مراكز التعليم الثانوي والتخصصي 🎓</option>
                            </select>
                            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                              * سيتم ربط ميزان المراجعة والأستاذ المساعد للفرع بمركز التكلفة المختار لغايات التحليل الفصلي.
                            </p>
                          </div>

                          {/* File Attachment drag area */}
                          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                            <Paperclip className="w-7 h-7 text-indigo-500 mb-1.5" />
                            <span className="text-xs font-black text-slate-700">أرفق المستندات والوصولات الثبوتية والمؤيدة للقيد</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">يدعم السحب والإفلات المباشر (PDF, PNG, JPG)</span>
                            <div className="mt-3 flex gap-2">
                              <button 
                                onClick={() => {
                                  const name = prompt('أدخل اسم الملف المراد إرفاقه كمؤيد مالي للقيد:');
                                  if (name) {
                                    setActiveJvState((prev: any) => ({
                                      ...prev,
                                      attachments: [...(prev.attachments || []), `${name} (ملف مالي مرفق)`]
                                    }));
                                    triggerNotification(`✓ تم ربط المرفق المحاسبي: ${name}`, 'success');
                                  }
                                }}
                                className="bg-white hover:bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 border border-slate-300 transition-all shadow-xs"
                              >
                                <Upload className="w-3.5 h-3.5 text-slate-500" />
                                <span>إرفاق ملف مؤيد للقيد 📂</span>
                              </button>
                              {activeJvState.attachments && activeJvState.attachments.length > 0 && (
                                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1">
                                  عدد المرفقات: {activeJvState.attachments.length}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* If maximized simple tab, show message */}
                    {activeJvTab === 'simple' && jvTableMaximized && (
                      <div className="p-4 text-center text-slate-400 text-[11px] font-bold">
                        الجدول مكبر حالياً. يرجى الضغط على "تصغير الجدول ⛶" للوصول إلى حقول القيد البسيط.
                      </div>
                    )}

                    {/* TAB 2: COMPOUND ENTRY SPREADSHEET */}
                    {activeJvTab === 'compound' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-500 text-xs font-extrabold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                            جدول قيد التسوية مركب الأطراف - Spreadsheet Mode
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const csv = prompt('قم بلصق محتويات جدول القيود بصيغة CSV (رقم الحساب,الاسم,البيان,المدين,الدائن,مركز التكلفة):');
                                if (csv) handleImportJvLinesFromCSV(csv);
                              }}
                              disabled={jvEditMode === 'view' || activeJvState.status === 'معتمد'}
                              className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 border border-slate-200 transition-all shadow-xs"
                            >
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                              <span>استيراد من Excel/CSV 📂</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveJvState((prev: any) => ({
                                  ...prev,
                                  lines: [
                                    ...prev.lines,
                                    {
                                      id: `l-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                                      accountCode: '',
                                      accountName: '',
                                      description: '',
                                      debit: 0,
                                      credit: 0,
                                      costCenter: 'primary'
                                    }
                                  ]
                                }));
                              }}
                              disabled={jvEditMode === 'view' || activeJvState.status === 'معتمد'}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              <Plus className="w-4 h-4" />
                              <span>إضافة سطر حساب ➕</span>
                            </button>
                          </div>
                        </div>

                        {/* SPREADSHEET CONTAINER with restricted height for ERP look */}
                        <div className={`border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-sm transition-all duration-300 ${
                          jvTableMaximized ? 'max-h-[480px]' : 'max-h-[220px]'
                        }`}>
                          <table className="w-full text-right border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50/75 text-slate-700 font-extrabold border-b border-slate-200 sticky top-0 z-10 shadow-xs">
                                <th className="p-3 text-center w-12 border-l border-slate-200">#</th>
                                <th className="p-3 w-48 border-l border-slate-200">رقم الحساب (الفرعي)</th>
                                <th className="p-3 w-56 border-l border-slate-200">اسم الحساب الفرعي بالدليل</th>
                                <th className="p-3 border-l border-slate-200">البيان والشرح التفصيلي للسطر</th>
                                <th className="p-3 w-32 border-l border-slate-200 text-center">مدين (Debit)</th>
                                <th className="p-3 w-32 border-l border-slate-200 text-center">دائن (Credit)</th>
                                <th className="p-3 w-40 border-l border-slate-200">مركز التكلفة</th>
                                <th className="p-3 text-center w-36">إجراءات السطر</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {activeJvState.lines.map((line: any, idx: number) => {
                                return (
                                  <tr 
                                    key={line.id} 
                                    className={`hover:bg-slate-50/50 transition duration-150 ${
                                      jvFocusedRowIndex === idx ? 'bg-indigo-50/40 ring-1 ring-inset ring-indigo-500' : ''
                                    }`}
                                    onClick={() => setJvFocusedRowIndex(idx)}
                                  >
                                    <td className="p-2 py-3 text-center text-slate-400 font-mono font-bold border-l border-slate-200">{idx + 1}</td>
                                    
                                    {/* Account Code Dropdown Selector */}
                                    <td className="p-1.5 border-l border-slate-200">
                                      <select
                                        value={line.accountCode}
                                        disabled={jvEditMode === 'view' || activeJvState.status === 'معتمد'}
                                        onChange={(e) => handleJvLineChange(line.id, 'accountCode', e.target.value)}
                                        className="w-full bg-white text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-bold text-xs transition-all"
                                      >
                                        <option value="">-- اختر حساب --</option>
                                        {accounts.filter(acc => acc.type === 'فرعي').map(acc => (
                                          <option key={acc.code} value={acc.code}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                      </select>
                                    </td>

                                    {/* Account Name */}
                                    <td className="p-2 py-3 border-l border-slate-200 text-slate-800 font-bold truncate max-w-[14rem]" title={line.accountName}>
                                      {line.accountName || <span className="text-slate-400 text-[10px] font-medium">يرجى اختيار الحساب</span>}
                                    </td>

                                    {/* Narration */}
                                    <td className="p-1.5 border-l border-slate-200">
                                      <input 
                                        type="text" 
                                        placeholder={activeJvState.description || "شرح مالي خاص بالسطر"}
                                        value={line.description}
                                        disabled={jvEditMode === 'view' || activeJvState.status === 'معتمد'}
                                        onChange={(e) => handleJvLineChange(line.id, 'description', e.target.value)}
                                        className="w-full bg-white text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-semibold transition-all"
                                      />
                                    </td>

                                    {/* Debit Input */}
                                    <td className="p-1.5 border-l border-slate-200">
                                      <input 
                                        type="number" 
                                        placeholder="0.00"
                                        value={line.debit || ''}
                                        disabled={jvEditMode === 'view' || activeJvState.status === 'معتمد' || line.credit > 0}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0;
                                          setActiveJvState((prev: any) => {
                                            const updatedLines = prev.lines.map((l: any) => l.id === line.id ? { ...l, debit: val, credit: 0 } : l);
                                            return {
                                              ...prev,
                                              lines: updatedLines,
                                              debitTotal: updatedLines.reduce((s: number, l: any) => s + (l.debit || 0), 0),
                                              creditTotal: updatedLines.reduce((s: number, l: any) => s + (l.credit || 0), 0)
                                            };
                                          });
                                        }}
                                        className="w-full bg-white text-emerald-800 text-center font-mono font-bold border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 text-xs transition-all"
                                      />
                                    </td>

                                    {/* Credit Input */}
                                    <td className="p-1.5 border-l border-slate-200">
                                      <input 
                                        type="number" 
                                        placeholder="0.00"
                                        value={line.credit || ''}
                                        disabled={jvEditMode === 'view' || activeJvState.status === 'معتمد' || line.debit > 0}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0;
                                          setActiveJvState((prev: any) => {
                                            const updatedLines = prev.lines.map((l: any) => l.id === line.id ? { ...l, debit: 0, credit: val } : l);
                                            return {
                                              ...prev,
                                              lines: updatedLines,
                                              debitTotal: updatedLines.reduce((s: number, l: any) => s + (l.debit || 0), 0),
                                              creditTotal: updatedLines.reduce((s: number, l: any) => s + (l.credit || 0), 0)
                                            };
                                          });
                                        }}
                                        className="w-full bg-white text-rose-800 text-center font-mono font-bold border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 text-xs transition-all"
                                      />
                                    </td>

                                    {/* Cost Center */}
                                    <td className="p-1.5 border-l border-slate-200">
                                      <select
                                        value={line.costCenter}
                                        disabled={jvEditMode === 'view' || activeJvState.status === 'معتمد'}
                                        onChange={(e) => handleJvLineChange(line.id, 'costCenter', e.target.value)}
                                        className="w-full bg-white text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-bold transition-all"
                                      >
                                        <option value="kindergarten">روضة 🎨</option>
                                        <option value="primary">ابتدائي 🎒</option>
                                        <option value="middle">إعدادي 📚</option>
                                        <option value="secondary">ثانوي 🎓</option>
                                      </select>
                                    </td>

                                    {/* Spreadsheet Row Actions */}
                                    <td className="p-1.5 py-3 text-center flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => handleCopyJvLine(line)}
                                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-950 rounded-md border border-slate-200 shadow-xs transition-all"
                                        title="نسخ بيانات السطر الحالي"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handlePasteJvLine(idx)}
                                        disabled={!copiedJvLine || jvEditMode === 'view' || activeJvState.status === 'معتمد'}
                                        className={`p-1.5 rounded-md border shadow-xs transition-all ${
                                          !copiedJvLine || jvEditMode === 'view' || activeJvState.status === 'معتمد'
                                            ? 'opacity-30 cursor-not-allowed text-slate-400 border-slate-100 bg-slate-50' 
                                            : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-950'
                                        }`}
                                        title="لصق البيانات المنسوخة"
                                      >
                                        <ArrowDownLeft className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setActiveJvState((prev: any) => {
                                            const newLines = [...prev.lines];
                                            newLines.splice(idx + 1, 0, {
                                              id: `l-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                                              accountCode: '',
                                              accountName: '',
                                              description: '',
                                              debit: 0,
                                              credit: 0,
                                              costCenter: 'primary'
                                            });
                                            return { ...prev, lines: newLines };
                                          });
                                          triggerNotification('➕ تم إدراج سطر محاسبي فارغ أسفل السطر الحالي', 'info');
                                        }}
                                        disabled={jvEditMode === 'view' || activeJvState.status === 'معتمد'}
                                        className="p-1.5 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-500 hover:text-indigo-600 rounded-md shadow-xs transition-all"
                                        title="إدراج سطر مالي فارغ أسفله"
                                      >
                                        <Plus className="w-3.5 h-3.5 text-indigo-500" />
                                      </button>
                                      <button
                                        onClick={() => handleMoveJvLine(idx, 'up')}
                                        disabled={idx === 0 || jvEditMode === 'view' || activeJvState.status === 'معتمد'}
                                        className="p-1 px-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-950 rounded-md border border-slate-200 shadow-xs disabled:opacity-30 transition-all font-mono text-[9px]"
                                        title="تحريك لأعلى"
                                      >
                                        ▲
                                      </button>
                                      <button
                                        onClick={() => handleMoveJvLine(idx, 'down')}
                                        disabled={idx === activeJvState.lines.length - 1 || jvEditMode === 'view' || activeJvState.status === 'معتمد'}
                                        className="p-1 px-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-950 rounded-md border border-slate-200 shadow-xs disabled:opacity-30 transition-all font-mono text-[9px]"
                                        title="تحريك لأسفل"
                                      >
                                        ▼
                                      </button>
                                      <button
                                        onClick={() => {
                                          setActiveJvState((prev: any) => {
                                            const updatedLines = prev.lines.filter((l: any) => l.id !== line.id);
                                            return {
                                              ...prev,
                                              lines: updatedLines,
                                              debitTotal: updatedLines.reduce((s: number, l: any) => s + (l.debit || 0), 0),
                                              creditTotal: updatedLines.reduce((s: number, l: any) => s + (l.credit || 0), 0)
                                            };
                                          });
                                          triggerNotification('🗑️ تم حذف السطر المالي المختار من الجدول', 'info');
                                        }}
                                        disabled={jvEditMode === 'view' || activeJvState.status === 'معتمد'}
                                        className="p-1.5 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-md shadow-xs disabled:opacity-30 transition-all"
                                        title="حذف السطر نهائياً"
                                      >
                                        <X className="w-3.5 h-3.5 text-rose-500" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Calculated Live Differences Indicator block - Highly elegant & integrated */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs shadow-xs mt-3">
                          <div className="flex items-center gap-5 text-slate-700 font-extrabold">
                            <div className="flex items-center gap-1">
                              <span>إجمالي المدين:</span>
                              <span className="font-mono text-emerald-800 font-black bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{activeJvState.debitTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} د.ل</span>
                            </div>
                            <span className="text-slate-300">|</span>
                            <div className="flex items-center gap-1">
                              <span>إجمالي الدائن:</span>
                              <span className="font-mono text-rose-800 font-black bg-rose-50 px-2 py-0.5 rounded border border-rose-100">{activeJvState.creditTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} د.ل</span>
                            </div>
                            <span className="text-slate-300">|</span>
                            <div className="flex items-center gap-1">
                              <span>الفرق الحسابي:</span>
                              <span className={`font-mono font-black px-2 py-0.5 rounded border ${
                                Math.abs(activeJvState.debitTotal - activeJvState.creditTotal) < 0.001 
                                  ? 'text-emerald-800 bg-emerald-50 border-emerald-100' 
                                  : 'text-rose-600 bg-rose-50 border-rose-200 animate-pulse'
                              }`}>
                                {Math.abs(activeJvState.debitTotal - activeJvState.creditTotal).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} د.ل
                              </span>
                            </div>
                          </div>

                          <div>
                            {Math.abs(activeJvState.debitTotal - activeJvState.creditTotal) < 0.001 ? (
                              <div className="text-emerald-800 text-[11px] font-black flex items-center gap-1 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full">
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span>القيد المحاسبي متزن تماماً ✔</span>
                              </div>
                            ) : (
                              <div className="text-rose-600 text-[11px] font-black flex items-center gap-1 bg-rose-100/70 border border-rose-200 px-3 py-1 rounded-full">
                                <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
                                <span>القيد غير متزن! يرجى موازنة الطرفين</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Audit Trail Panel inside Workspace */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <h3 className="text-xs font-black text-slate-800 pb-2.5 border-b border-slate-200 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span>سجل الرقابة المالية والتدقيق للقيد المحاسبي (Audit Trail)</span>
                    </h3>
                    <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
                      {jvAuditTrail.filter((a: any) => a.jvId === activeJvState.id).length === 0 ? (
                        <p className="text-xs text-slate-400 font-extrabold italic">لا توجد حركات تدقيق مسجلة حتى الآن على هذا السند المالي.</p>
                      ) : (
                        jvAuditTrail.filter((a: any) => a.jvId === activeJvState.id).map((a: any) => (
                           <div key={a.id} className="text-[11px] flex items-center justify-between bg-slate-50 border border-slate-200/60 p-2 rounded-lg">
                             <div className="flex items-center gap-3 text-slate-600">
                               <span className="font-mono text-slate-400 text-[10px]">[{a.timestamp}]</span>
                               <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{a.action}</span>
                               <span className="text-slate-800 font-semibold">{a.details}</span>
                             </div>
                             <div className="flex items-center gap-1 text-[10px] text-slate-400 font-extrabold">
                               <span>المسؤول المستلم:</span>
                               <span className="text-slate-700 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded">{a.user}</span>
                             </div>
                           </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. FOOTER STATUS BAR */}
                <div className="bg-slate-100 text-slate-600 border-t border-slate-200 text-[10px] px-4 py-1.5 flex items-center justify-between shadow-xs font-bold">
                  <div className="flex items-center gap-4">
                    <span>عدد بنود التسوية: <b className="text-slate-800 font-mono">{activeJvState.lines.length}</b></span>
                    <span>|</span>
                    <span>إجمالي القيد: <b className="text-slate-800 font-mono">{activeJvState.debitTotal.toLocaleString()} د.ل</b></span>
                    <span>|</span>
                    <span className="flex items-center gap-1">
                      <span>الرصيد العام للأستاذ:</span>
                      {Math.abs(activeJvState.debitTotal - activeJvState.creditTotal) < 0.001 ? (
                        <b className="text-green-700 font-bold flex items-center gap-0.5 font-mono">متوازن تماماً (0.00) ✔</b>
                      ) : (
                        <b className="text-red-600 font-bold animate-pulse flex items-center gap-0.5 font-mono">
                          غير متوازن ({Math.abs(activeJvState.debitTotal - activeJvState.creditTotal).toLocaleString()}) ⚠️
                        </b>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span>المدقق المالي: <b className="text-indigo-400 font-extrabold">سليمان غازي (مدير النظام)</b></span>
                    <span>|</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>متصل بقاعدة مجمع المدارس الموحد (Cloud SQL Secure)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* ========================================================== */}
            {/* STANDARD LIST VIEW (IF NOT FULLSCREEN) */}
            {/* ========================================================== */}
            {!isJvFullscreen && (
              <>
                {/* 1. Dashboard Metrics Summary Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">إجمالي الحركات المؤرشفة</span>
                      <span className="text-lg font-black text-slate-900 font-mono">{journalEntries.length} قيداً</span>
                    </div>
                    <div className="bg-slate-50 text-slate-700 p-2 rounded-lg">
                      <FileText className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">الحالة وميزان المراجعة للفرع</span>
                      <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>متطابق تماماً ✔</span>
                      </span>
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">القيود المرحلة للأستاذ</span>
                      <span className="text-lg font-black text-indigo-900 font-mono">
                        {journalEntries.filter(j => isPostedJournalStatus(j.status)).length} قيود
                      </span>
                    </div>
                    <div className="bg-indigo-50 text-indigo-700 p-2 rounded-lg">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">مسودات معلقة للتسوية</span>
                      <span className="text-lg font-black text-amber-950 font-mono">
                        {journalEntries.filter(j => j.status === 'مسودة').length} مسودات
                      </span>
                    </div>
                    <div className="bg-amber-50 text-amber-700 p-2 rounded-lg">
                      <Edit3 className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* 2. List Toolbar & Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900">سجل قيود اليومية المحاسبية الموحد للفرع</h2>
                    <p className="text-xs text-slate-500 mt-1">إدخال، مراجعة وتعدين قيود التسوية المزدوجة المتطابقة بالاستعلام السريع</p>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowJvSearchOverlay(true)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
                    >
                      <Search className="w-4 h-4" />
                      <span>بحث متقدم بالقيود 🔎</span>
                    </button>

                    <button 
                      onClick={handlePrepareNewJv}
                      disabled={!journalWritesAreAvailable}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{journalWritesAreAvailable ? journalWritesAreCanonical ? 'فتح شاشة القيود الاحترافية (ERP) 🖥️' : journalWriteBlockedLabel : 'شاشة القيود — قراءة فقط'}</span>
                    </button>
                  </div>
                </div>

                {/* 3. The Core Listing Table */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden text-[11px]">
                  <table className="w-full text-right border-collapse">
                    <thead className="bg-slate-800 text-slate-100 font-bold border-b border-slate-300">
                      <tr className="h-[30px]">
                        <th className="px-3 py-1 w-24 border-l border-slate-700">رقم القيد</th>
                        <th className="px-3 py-1 w-28 border-l border-slate-700">تاريخ السند</th>
                        <th className="px-3 py-1 w-28 border-l border-slate-700">النوع مالي</th>
                        <th className="px-3 py-1 border-l border-slate-700">البيان والشرح العام المبرر للقيد</th>
                        <th className="px-3 py-1 text-center w-32 border-l border-slate-700">إجمالي المدين (Debit)</th>
                        <th className="px-3 py-1 text-center w-32 border-l border-slate-700">إجمالي الدائن (Credit)</th>
                        <th className="px-3 py-1 text-center w-28 border-l border-slate-700">حالة السند</th>
                        <th className="px-3 py-1 text-center w-32">الرقابة والتحرير</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                      {journalEntries.slice((jvPage - 1) * JV_PAGE_SIZE, jvPage * JV_PAGE_SIZE).map((entry, idx) => {
                        const isCanonicalPostedEntry = String(entry.id || '').startsWith('ERP-JV-') && isPostedJournalStatus(entry.status);
                        return (
                        <tr 
                          key={entry.id} 
                          className={`h-[28px] hover:bg-slate-50 transition cursor-pointer ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}
                          onDoubleClick={() => handleEditJv(entry.id)}
                        >
                          <td className="px-3 py-1 font-mono font-black text-blue-700 border-l border-slate-200">{entry.id}</td>
                          <td className="px-3 py-1 font-mono text-slate-500 border-l border-slate-200">{entry.date}</td>
                          <td className="px-3 py-1 border-l border-slate-200">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                              entry.type === 'بسيط' ? 'bg-cyan-50 text-cyan-800 border border-cyan-100' : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                            }`}>
                              {entry.type || 'بسيط'}
                            </span>
                          </td>
                          <td className="px-3 py-1 font-bold text-slate-800 border-l border-slate-200" title={entry.description}>
                            <div className="truncate max-w-[20rem] font-sans font-extrabold text-slate-800">{entry.description}</div>
                            {entry.studentPaymentId && (
                              <div className="flex flex-wrap items-center gap-1 mt-0.5 text-[8px] font-black select-none">
                                <span className="bg-sky-50 text-sky-800 px-1.5 py-0.2 rounded border border-sky-150 font-mono font-bold">
                                  عملية: {entry.studentPaymentId}
                                </span>
                                <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-150 font-mono font-bold">
                                  سند قبض: {entry.receiptVoucherId}
                                </span>
                                <span className="bg-slate-50 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200 font-sans">
                                  الطالب: {entry.studentName}
                                </span>
                                <span className="bg-indigo-50 text-indigo-800 px-1.5 py-0.2 rounded border border-indigo-150 font-sans">
                                  المرحلة: {entry.stage}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-1 text-center font-mono text-emerald-700 font-black border-l border-slate-200" dir="ltr">
                            {entry.debitTotal.toLocaleString()} {currency}
                          </td>
                          <td className="px-3 py-1 text-center font-mono text-blue-750 font-black border-l border-slate-200" dir="ltr">
                            {entry.creditTotal.toLocaleString()} {currency}
                          </td>
                          <td className="px-3 py-1 text-center border-l border-slate-200">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                              entry.status === 'معتمد' ? 'bg-indigo-50 text-indigo-800 border-indigo-100' :
                              isPostedJournalStatus(entry.status) ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                              'bg-amber-50 text-amber-800 border-amber-100'
                            }`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-3 py-1 text-center flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditJv(entry.id)}
                              className="text-blue-600 hover:text-blue-750 font-black hover:underline"
                              title="عرض تفاصيل القيد"
                            >
                              {isCanonicalPostedEntry ? 'عرض التفاصيل 👁️' : journalWritesAreAvailable ? 'عرض/تحرير 🖥️' : 'عرض فقط 👁️'}
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              onClick={() => handleDeleteJv(entry.id)}
                              disabled={!journalWritesAreAvailable || isCanonicalPostedEntry}
                              className="text-rose-500 hover:text-rose-600 font-bold hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
                              title={isCanonicalPostedEntry ? 'القيد الكانوني محمي؛ استخدم الإلغاء العكسي من مصدر الحركة.' : journalWritesAreAvailable ? 'حذف القيد من المصدر المركزي' : 'الحذف متوقف — دفتر الأستاذ للقراءة فقط'}
                            >
                              {isCanonicalPostedEntry ? 'محمي — canonical' : journalWritesAreAvailable ? 'حذف 🗑️' : 'حذف — قراءة فقط'}
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {journalEntries.length > JV_PAGE_SIZE && (
                    <div className="flex items-center justify-between p-3 border-t border-slate-200 bg-slate-50">
                      <div className="text-xs font-bold text-slate-500 font-mono">
                        عرض {(jvPage - 1) * JV_PAGE_SIZE + 1} إلى {Math.min(jvPage * JV_PAGE_SIZE, journalEntries.length)} من أصل {journalEntries.length} قيد
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          disabled={jvPage === 1}
                          onClick={() => setJvPage(p => p - 1)}
                          className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          السابق
                        </button>
                        <span className="px-3 py-1 text-xs font-bold font-mono text-slate-700">
                          {jvPage} / {Math.ceil(journalEntries.length / JV_PAGE_SIZE)}
                        </span>
                        <button 
                          disabled={jvPage >= Math.ceil(journalEntries.length / JV_PAGE_SIZE)}
                          onClick={() => setJvPage(p => p + 1)}
                          className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          التالي
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
    </>
  );
};
