import { Invoice, InvoiceLine, InvoiceTax, InvoiceDiscount, InvoiceCharge, InvoiceReference, InvoiceStatus, InvoiceVersion, InvoiceAudit } from '../../types';
import { InvoiceRepository } from '../repositories/InvoiceRepository';
import { InvoiceValidator } from './InvoiceValidator';
import { InvoicePolicyService } from './InvoicePolicyService';
import { AcademicRevenueRecognitionEngine } from './AcademicRevenueRecognitionEngine';
import { PostingEngine } from './PostingEngine';
import { AuditRepository } from '../repositories/AuditRepository';
import { FinancialConfigurationRepository } from '../repositories/FinancialConfigurationRepository';
import { FallbackStorage } from '../repositories/FallbackStorage';
import { UnitOfWork } from '../UnitOfWork';
import { EnterpriseLogger } from './EnterpriseLogger';

export interface AuditMetadata {
  userId: string;
  userName: string;
  userRole: string;
  ipAddress?: string;
}

/**
 * Enterprise Invoice Engine
 * Grand orchestrator representing the single source of truth for all invoice operations.
 * Completely isolates business workflows from visual views and database layers.
 */
export class InvoiceEngine {

  /**
   * Helper to construct audit trail metadata.
   */
  private static getAuditMeta(meta?: AuditMetadata): AuditMetadata {
    return {
      userId: meta?.userId || 'system_invoice_engine',
      userName: meta?.userName || 'Enterprise Invoice Engine',
      userRole: meta?.userRole || 'Enterprise Domain Architect',
      ipAddress: meta?.ipAddress || '127.0.0.1'
    };
  }

  /**
   * 1. Creates a brand new Invoice under Draft status.
   * Full validation is run, tenant isolation is locked, and duplicate detection is executed.
   */
  public static async createInvoice(
    schoolId: string,
    invoiceData: Partial<Invoice>,
    meta?: AuditMetadata
  ): Promise<Invoice> {
    const auditMeta = this.getAuditMeta(meta);

    // Enforce Tenant Isolation
    invoiceData.schoolId = schoolId;
    invoiceData.status = 'Draft';

    // 1. Run basic validator
    await InvoiceValidator.validate(invoiceData, true);

    // 2. Prevent duplicate active invoices for the same student and item description
    const isDuplicate = await InvoicePolicyService.isDuplicate(
      schoolId,
      invoiceData.studentId!,
      invoiceData.item!
    );
    if (isDuplicate) {
      throw new Error(`حظر تكرار: توجد بالفعل فاتورة نشطة أو غير ملغاة لهذا الطالب بنفس بند الرسوم المحدد: ${invoiceData.item}`);
    }

    // 3. Compute totals
    const totals = InvoicePolicyService.calculateTotals(invoiceData);
    invoiceData.amount = totals.amount;
    invoiceData.taxAmount = totals.taxAmount;
    invoiceData.totalAmount = totals.totalAmount;
    invoiceData.remainingAmount = totals.remainingAmount;
    invoiceData.version = 1;

    // 4. Set Initial Audit and Status History
    const initialAudit: InvoiceAudit = {
      id: `inv_aud_${Date.now()}_1`,
      action: 'Create',
      timestamp: new Date().toISOString(),
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      details: 'إنشاء مسودة الفاتورة لأول مرة في النظام.',
      ipAddress: auditMeta.ipAddress
    };

    invoiceData.audits = [initialAudit];
    invoiceData.statusHistory = [{
      id: `inv_sh_${Date.now()}_1`,
      fromStatus: 'None',
      toStatus: 'Draft',
      timestamp: new Date().toISOString(),
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      reason: 'الإنشاء التأسيسي للمسودة.'
    }];

    // 5. Persist via Repository
    const created = await InvoiceRepository.create(schoolId, invoiceData);

    // 6. System Audit log
    await AuditRepository.log(
      schoolId,
      auditMeta.userId,
      auditMeta.userName,
      auditMeta.userRole,
      'CREATE_INVOICE',
      'INVOICE_ENGINE',
      auditMeta.ipAddress || '127.0.0.1',
      `تم إنشاء مسودة الفاتورة رقم ${created.id} للطالب ${created.studentName} بقيمة إجمالية ${created.totalAmount} د.ل.`,
      { affectedRecord: created.id, valuesAfter: created }
    );

    return created;
  }

  /**
   * 2. Submits Invoice for Approval.
   */
  public static async submitForApproval(
    schoolId: string,
    invoiceId: string,
    meta?: AuditMetadata
  ): Promise<Invoice> {
    const auditMeta = this.getAuditMeta(meta);
    const invoice = await InvoiceRepository.getById(schoolId, invoiceId);
    if (!invoice) {
      throw new Error(`الفاتورة غير موجودة: ${invoiceId}`);
    }

    InvoiceValidator.validateStateTransition(invoice.status, 'Pending Approval');

    const history = [...(invoice.statusHistory || [])];
    history.push({
      id: `inv_sh_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      fromStatus: invoice.status,
      toStatus: 'Pending Approval',
      timestamp: new Date().toISOString(),
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      reason: 'تقديم الفاتورة للمراجعة والاعتماد المالي.'
    });

    const audits = [...(invoice.audits || [])];
    audits.push({
      id: `inv_aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      action: 'Submit Approval',
      timestamp: new Date().toISOString(),
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      details: 'تقديم الفاتورة للاعتماد.',
      ipAddress: auditMeta.ipAddress
    });

    const updated = await InvoiceRepository.update(schoolId, invoiceId, {
      status: 'Pending Approval',
      statusHistory: history,
      audits: audits,
      version: invoice.version
    });

    await AuditRepository.log(
      schoolId,
      auditMeta.userId,
      auditMeta.userName,
      auditMeta.userRole,
      'SUBMIT_APPROVAL',
      'INVOICE_ENGINE',
      auditMeta.ipAddress || '127.0.0.1',
      `تم تقديم الفاتورة ${invoiceId} للاعتماد المالي.`,
      { affectedRecord: invoiceId }
    );

    return updated;
  }

  /**
   * 3. Approves the Invoice.
   */
  public static async approveInvoice(
    schoolId: string,
    invoiceId: string,
    meta?: AuditMetadata
  ): Promise<Invoice> {
    const auditMeta = this.getAuditMeta(meta);
    const invoice = await InvoiceRepository.getById(schoolId, invoiceId);
    if (!invoice) {
      throw new Error(`الفاتورة غير موجودة: ${invoiceId}`);
    }

    InvoiceValidator.validateStateTransition(invoice.status, 'Approved');

    const history = [...(invoice.statusHistory || [])];
    history.push({
      id: `inv_sh_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      fromStatus: invoice.status,
      toStatus: 'Approved',
      timestamp: new Date().toISOString(),
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      reason: 'اعتماد الفاتورة مالياً بنجاح.'
    });

    const audits = [...(invoice.audits || [])];
    audits.push({
      id: `inv_aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      action: 'Approve',
      timestamp: new Date().toISOString(),
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      details: 'اعتماد الفاتورة رسمياً.',
      ipAddress: auditMeta.ipAddress
    });

    const updated = await InvoiceRepository.update(schoolId, invoiceId, {
      status: 'Approved',
      statusHistory: history,
      audits: audits,
      version: invoice.version
    });

    await AuditRepository.log(
      schoolId,
      auditMeta.userId,
      auditMeta.userName,
      auditMeta.userRole,
      'APPROVE_INVOICE',
      'INVOICE_ENGINE',
      auditMeta.ipAddress || '127.0.0.1',
      `تم اعتماد الفاتورة ${invoiceId} مالياً.`,
      { affectedRecord: invoiceId }
    );

    return updated;
  }

  /**
   * 4. Issues the Invoice.
   * Generates a unique secure document number from NumberSequence.
   * Updates student outstanding balances.
   * Integrates with General Ledger (Double-Entry Posting) and schedules Revenue Recognition (IFRS 15).
   */
  public static async issueInvoice(
    schoolId: string,
    invoiceId: string,
    meta?: AuditMetadata
  ): Promise<Invoice> {
    const auditMeta = this.getAuditMeta(meta);

    return await UnitOfWork.runInTransaction(schoolId, {
      operationName: `إصدار الفاتورة بقيمة تسلسلية محتفظ بها ${invoiceId}`,
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      ipAddress: auditMeta.ipAddress || '127.0.0.1',
      tenantId: schoolId,
      affectedTables: ['invoices', 'journal_entries', 'general_ledger', 'recognition_schedules', 'students']
    } as any, async () => {
      const invoice = await InvoiceRepository.getById(schoolId, invoiceId);
      if (!invoice) {
        throw new Error(`الفاتورة غير موجودة: ${invoiceId}`);
      }

      InvoiceValidator.validateStateTransition(invoice.status, 'Issued');

      // 1. Generate unique sequence invoice number
      const fiscalYear = invoice.fiscalYearId || '2026';
      const branchId = invoice.branchId || 'branch_main';
      const invoiceNumber = await InvoiceRepository.incrementAndGetNextNumber(schoolId, branchId, fiscalYear);

      // 2. Map accounting integration
      const history = [...(invoice.statusHistory || [])];
      history.push({
        id: `inv_sh_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        fromStatus: invoice.status,
        toStatus: 'Issued',
        timestamp: new Date().toISOString(),
        userId: auditMeta.userId,
        userName: auditMeta.userName,
        reason: 'إصدار الفاتورة وتوليد الرقم التسلسلي المحمي.'
      });

      const audits = [...(invoice.audits || [])];
      audits.push({
        id: `inv_aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        action: 'Issue',
        timestamp: new Date().toISOString(),
        userId: auditMeta.userId,
        userName: auditMeta.userName,
        details: `إصدار وتعميم الفاتورة بالرقم التسلسلي: ${invoiceNumber}`,
        ipAddress: auditMeta.ipAddress
      });

      // 3. Increment Student Outstanding Balances
      const students = FallbackStorage.getStudents();
      const studIdx = students.findIndex(s => s.id === invoice.studentId);
      if (studIdx !== -1) {
        students[studIdx].feesRemaining += (invoice.totalAmount ?? invoice.amount);
        FallbackStorage.saveStudents(students);
      }

      // 4. Persist
      const issuedInvoice = await InvoiceRepository.update(schoolId, invoiceId, {
        status: 'Issued',
        invoiceNumber,
        statusHistory: history,
        audits: audits,
        version: invoice.version
      });

      // 5. Integrate IFRS Revenue Recognition
      try {
        await AcademicRevenueRecognitionEngine.generateSchedule(
          schoolId,
          issuedInvoice.id,
          auditMeta.userId,
          auditMeta.userName
        );
      } catch (err: any) {
        if (FallbackStorage.isCanonicalPersistenceRequired()) {
          throw err;
        }
        EnterpriseLogger.warn('Revenue recognition scheduling unavailable in local compatibility mode:', 'InvoiceEngine', { error: err?.message || err });
      }

      // 6. Double-Entry General Ledger Posting Integration
      let finalIssuedInvoice = issuedInvoice;
      try {
        const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
        const debitAccount = config.revenueRecognition.deferredRevenueAccount;
        const creditAccount = config.revenueRecognition.earnedRevenueAccount;
        if (!debitAccount || !creditAccount) {
          throw new Error('ACCOUNTING DECISION REQUIRED: لا يوجد Mapping معتمد لحسابي الإيراد المؤجل والمحقق.');
        }
        
        const totalVal = issuedInvoice.totalAmount ?? issuedInvoice.amount;

        const journalDraft = await PostingEngine.createJournalEntryDraft(schoolId, {
          schoolId,
          date: issuedInvoice.invoiceDate,
          description: `قيد آلي مركب لإصدار الفاتورة رقم ${invoiceNumber} للطالب ${issuedInvoice.studentName}`,
          status: 'draft',
          items: [
            { accountId: debitAccount, debit: totalVal, credit: 0 },
            { accountId: creditAccount, debit: 0, credit: totalVal }
          ],
          totalDebit: totalVal,
          totalCredit: totalVal,
          referenceType: 'invoice',
          referenceId: issuedInvoice.id,
          createdAt: new Date().toISOString()
        });

        // Post it to register general ledger impact
        await PostingEngine.postJournalEntry(schoolId, journalDraft.id, {
          userId: auditMeta.userId,
          userName: auditMeta.userName,
          userRole: auditMeta.userRole,
          ipAddress: auditMeta.ipAddress || '127.0.0.1'
        });

        // Update invoice references with journal entry id
        finalIssuedInvoice = await InvoiceRepository.update(schoolId, invoiceId, {
          journalEntryId: journalDraft.id,
          version: issuedInvoice.version
        });

      } catch (err: any) {
        EnterpriseLogger.error('Double-entry ledger posting integration failed; invoice transaction will roll back:', 'InvoiceEngine', { error: err?.message || err });
        throw err;
      }

      // Register with the Accounts Receivable Engine (Single Point of Truth)
      try {
        const { AccountsReceivableEngine } = await import('./AccountsReceivableEngine');
        await AccountsReceivableEngine.registerInvoiceAsReceivable(schoolId, finalIssuedInvoice.id, {
          userId: auditMeta.userId,
          userName: auditMeta.userName,
          userRole: auditMeta.userRole,
          ipAddress: auditMeta.ipAddress
        });
      } catch (err: any) {
        if (FallbackStorage.isCanonicalPersistenceRequired()) {
          throw err;
        }
        EnterpriseLogger.warn('AR subledger registration unavailable in local compatibility mode:', 'InvoiceEngine', { error: err?.message || err });
      }

      await AuditRepository.log(
        schoolId,
        auditMeta.userId,
        auditMeta.userName,
        auditMeta.userRole,
        'ISSUE_INVOICE',
        'INVOICE_ENGINE',
        auditMeta.ipAddress || '127.0.0.1',
        `تم إصدار وتعميم الفاتورة الرسمية رقم ${invoiceNumber} بقيمة إجمالية ${issuedInvoice.totalAmount} د.ل.`,
        { affectedRecord: invoiceId }
      );

      return finalIssuedInvoice;
    });
  }

  /**
   * 5. Modifies Invoice before Issuance.
   * Captures full history snapshot (Versioning) to meet compliance audit trails.
   */
  public static async updateInvoice(
    schoolId: string,
    invoiceId: string,
    updates: Partial<Invoice>,
    reason: string,
    meta?: AuditMetadata
  ): Promise<Invoice> {
    const auditMeta = this.getAuditMeta(meta);
    const invoice = await InvoiceRepository.getById(schoolId, invoiceId);
    if (!invoice) {
      throw new Error(`الفاتورة غير موجودة: ${invoiceId}`);
    }

    // 1. Policy check: Block direct modification after approval or issuance of core financial and identity fields
    const lockStatuses = [
      'Approved',
      'Issued',
      'Sent',
      'Partially Paid',
      'Paid',
      'Overdue',
      'Disputed',
      'Void',
      'Credit Issued',
      'Refunded',
      'Archived',
      'paid', // legacy
      'partial', // legacy
      'written_off' // legacy
    ];
    if (lockStatuses.includes(invoice.status)) {
      const isCoreChanged = (
        (updates.amount !== undefined && updates.amount !== invoice.amount) ||
        (updates.totalAmount !== undefined && updates.totalAmount !== invoice.totalAmount) ||
        (updates.studentId !== undefined && updates.studentId !== invoice.studentId) ||
        (updates.currency !== undefined && updates.currency !== invoice.currency) ||
        (updates.academicYearId !== undefined && updates.academicYearId !== invoice.academicYearId) ||
        (updates.fiscalYearId !== undefined && updates.fiscalYearId !== invoice.fiscalYearId) ||
        (updates.lines !== undefined && JSON.stringify(updates.lines) !== JSON.stringify(invoice.lines)) ||
        (updates.taxes !== undefined && JSON.stringify(updates.taxes) !== JSON.stringify(invoice.taxes)) ||
        (updates.discounts !== undefined && JSON.stringify(updates.discounts) !== JSON.stringify(invoice.discounts)) ||
        (updates.charges !== undefined && JSON.stringify(updates.charges) !== JSON.stringify(invoice.charges))
      );
      if (isCoreChanged) {
        throw new Error('حظر التعديل المالي: لا يمكن تعديل المبلغ، الطالب، الرسوم، الضرائب، العملة، الأقساط، السنة الدراسية، أو السنة المالية للفاتورة بعد اعتمادها أو إصدارها المعتمد. لتسوية الفروقات يرجى استخدام الإشعارات الدائنة/المدينة (Credit/Debit Notes) أو إصدار فاتورة بديلة (Replacement Invoice).');
      }
    }

    // 2. Version snapshot generation
    const currentVersions = invoice.versions || [];
    const nextVerNo = (invoice.version || 1);
    const newVersionSnap: InvoiceVersion = {
      id: `inv_ver_${Date.now()}_${nextVerNo}`,
      invoiceId,
      versionNumber: nextVerNo,
      createdAt: new Date().toISOString(),
      createdBy: auditMeta.userId,
      reason: reason || 'تعديل وتحديث بند أو قيمة الفاتورة قبل الإصدار.',
      snapshot: JSON.parse(JSON.stringify(invoice))
    };

    currentVersions.push(newVersionSnap);

    // 3. Recompute totals on merged state
    const mergedState = { ...invoice, ...updates };
    await InvoiceValidator.validate(mergedState, false);

    const totals = InvoicePolicyService.calculateTotals(mergedState);
    updates.amount = totals.amount;
    updates.taxAmount = totals.taxAmount;
    updates.totalAmount = totals.totalAmount;
    updates.remainingAmount = totals.remainingAmount;

    // 4. Log Version Change Audit
    const audits = [...(invoice.audits || [])];
    audits.push({
      id: `inv_aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      action: 'Version Change',
      timestamp: new Date().toISOString(),
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      details: `تحديث الفاتورة وإنشاء إصدار أرشيفي جديد (${nextVerNo}) للمطابقة الحسابية.`,
      ipAddress: auditMeta.ipAddress
    });

    updates.versions = currentVersions;
    updates.audits = audits;
    updates.version = invoice.version; // optimistic lock check matches current

    const updated = await InvoiceRepository.update(schoolId, invoiceId, updates);

    await AuditRepository.log(
      schoolId,
      auditMeta.userId,
      auditMeta.userName,
      auditMeta.userRole,
      'UPDATE_INVOICE_VERSION',
      'INVOICE_ENGINE',
      auditMeta.ipAddress || '127.0.0.1',
      `تم تحديث الفاتورة ${invoiceId} وإنشاء إصدار جديد رقم ${updated.version}.`,
      { affectedRecord: invoiceId }
    );

    return updated;
  }

  /**
   * 6. Generates an adjustment Credit Note.
   * Following safe accounting practices, we generate a linked credit note instead of changing historical documents.
   */
  public static async createCreditNote(
    schoolId: string,
    originalInvoiceId: string,
    amount: number,
    reason: string,
    meta?: AuditMetadata
  ): Promise<Invoice> {
    const auditMeta = this.getAuditMeta(meta);

    return await UnitOfWork.runInTransaction(schoolId, {
      operationName: `إنشاء إشعار دائن للفاتورة ${originalInvoiceId}`,
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      ipAddress: auditMeta.ipAddress || '127.0.0.1',
      tenantId: schoolId,
      affectedTables: ['invoices', 'journal_entries', 'general_ledger', 'students']
    } as any, async () => {
      const invoice = await InvoiceRepository.getById(schoolId, originalInvoiceId);
      if (!invoice) {
        throw new Error(`الفاتورة الأصلية غير موجودة: ${originalInvoiceId}`);
      }

      if (amount <= 0 || amount > (invoice.totalAmount ?? invoice.amount)) {
        throw new Error(`قيمة الإشعار الدائن غير صالحة. يجب أن تكون موجبة ولا تتجاوز إجمالي الفاتورة (${invoice.totalAmount ?? invoice.amount}).`);
      }

      // 1. Create a credit note document (which is technically a negative invoice referenced to original)
      const creditNoteId = `CN-${Date.now()}`;
      const creditNote: Partial<Invoice> = {
        id: creditNoteId,
        studentId: invoice.studentId,
        studentName: invoice.studentName,
        amount: -amount,
        totalAmount: -amount,
        remainingAmount: 0,
        dueDate: new Date().toISOString().split('T')[0],
        status: 'Issued',
        item: `إشعار دائن للفاتورة ${invoice.invoiceNumber || invoice.id} - السبب: ${reason}`,
        taxAmount: 0,
        invoiceDate: new Date().toISOString().split('T')[0],
        schoolId,
        academicYearId: invoice.academicYearId,
        fiscalYearId: invoice.fiscalYearId,
        invoiceNumber: `CN-${invoice.invoiceNumber || invoice.id}`,
        references: [{
          type: 'credit_note',
          referenceId: originalInvoiceId,
          referenceNumber: invoice.invoiceNumber || originalInvoiceId
        }]
      };

      const createdCN = await InvoiceRepository.create(schoolId, creditNote);

      // 2. Adjust original invoice remaining balances
      const newRemaining = Math.max(0, (invoice.remainingAmount ?? invoice.totalAmount ?? invoice.amount) - amount);
      const newStatus: InvoiceStatus = newRemaining === 0 ? 'Refunded' : 'Partially Paid';
      
      const originalAudits = [...(invoice.audits || [])];
      originalAudits.push({
        id: `inv_aud_${Date.now()}_cn`,
        action: 'Credit Note',
        timestamp: new Date().toISOString(),
        userId: auditMeta.userId,
        userName: auditMeta.userName,
        details: `تطبيق إشعار دائن بقيمة ${amount} د.ل. الرقم: ${creditNoteId}`,
        ipAddress: auditMeta.ipAddress
      });

      await InvoiceRepository.update(schoolId, originalInvoiceId, {
        remainingAmount: newRemaining,
        status: newStatus,
        audits: originalAudits,
        version: invoice.version
      });

      // 2.5 Adjust installment schedules if there's any active plan
      try {
        const { InstallmentEngine } = await import('./InstallmentEngine');
        const invoiceNewTotal = Math.max(0, (invoice.totalAmount ?? invoice.amount) - amount);
        await InstallmentEngine.adjustPlanForInvoiceAmountChange(
          schoolId,
          originalInvoiceId,
          invoiceNewTotal,
          auditMeta.userId,
          auditMeta.userName,
          `تخفيض القيمة بسبب إصدار إشعار دائن بقيمة ${amount} د.ل.`
        );
      } catch (err: any) {
        EnterpriseLogger.warn('Installment plan adjustment failed or ignored during Credit Note issuance:', 'InvoiceEngine', { error: err?.message || err });
      }

      // 3. Decrement student outstanding remaining balance
      const students = FallbackStorage.getStudents();
      const studIdx = students.findIndex(s => s.id === invoice.studentId);
      if (studIdx !== -1) {
        students[studIdx].feesRemaining = Math.max(0, students[studIdx].feesRemaining - amount);
        FallbackStorage.saveStudents(students);
      }

      // 4. Adjust IFRS Revenue recognition schedules dynamically
      try {
        await AcademicRevenueRecognitionEngine.handleAdjustment(
          schoolId,
          originalInvoiceId,
          'Credit Note',
          invoice.totalAmount! - amount,
          auditMeta.userId,
          auditMeta.userName,
          `تعديل آلي نتيجة إصدار إشعار دائن: ${reason}`
        );
      } catch (err: any) {
        EnterpriseLogger.warn('IFRS adjustment recognition failure bypassed:', 'InvoiceEngine', { error: err?.message || err });
      }

      // 5. Post accounting impact of Credit Note to General Ledger
      try {
        const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
        const debitAccount = config.revenueRecognition.deferredRevenueAccount;
        const creditAccount = config.revenueRecognition.earnedRevenueAccount;
        if (!debitAccount || !creditAccount) {
          throw new Error('ACCOUNTING DECISION REQUIRED: لا يوجد Mapping معتمد لإشعار الدائن.');
        }
        
        const journalDraft = await PostingEngine.createJournalEntryDraft(schoolId, {
          schoolId,
          date: createdCN.invoiceDate,
          description: `قيد ترحيل إشعار دائن لتسوية وتخفيض قيمة الفاتورة ${invoice.invoiceNumber || invoice.id}`,
          status: 'draft',
          items: [
            { accountId: creditAccount, debit: amount, credit: 0 }, // debit revenue to reduce it
            { accountId: debitAccount, debit: 0, credit: amount }  // credit deferred to reduce asset/receivable
          ],
          totalDebit: amount,
          totalCredit: amount,
          referenceType: 'reversal',
          referenceId: originalInvoiceId,
          createdAt: new Date().toISOString()
        });

        await PostingEngine.postJournalEntry(schoolId, journalDraft.id, {
          userId: auditMeta.userId,
          userName: auditMeta.userName,
          userRole: auditMeta.userRole,
          ipAddress: auditMeta.ipAddress || '127.0.0.1'
        });
      } catch (err: any) {
        EnterpriseLogger.error('Failed to post credit note accounting ledger entries; transaction will roll back:', 'InvoiceEngine', { error: err?.message || err });
        throw err;
      }

      // Adjust with Accounts Receivable Engine using policy adjustment
      try {
        const { AccountsReceivableRepository } = await import('../repositories/AccountsReceivableRepository');
        const arAccount = await AccountsReceivableRepository.getAccountByStudentId(schoolId, invoice.studentId);
        if (arAccount) {
          const { AccountsReceivableEngine } = await import('./AccountsReceivableEngine');
          await AccountsReceivableEngine.processAdjustment(schoolId, arAccount.id, {
            type: 'discount',
            amount: amount,
            reason: `إشعار دائن رقم ${creditNoteId}: ${reason}`,
            invoiceId: originalInvoiceId
          }, {
            userId: auditMeta.userId,
            userName: auditMeta.userName,
            userRole: auditMeta.userRole,
            ipAddress: auditMeta.ipAddress
          });
        }
      } catch (err: any) {
        if (FallbackStorage.isCanonicalPersistenceRequired()) {
          throw err;
        }
        EnterpriseLogger.warn('AR adjustment unavailable in local compatibility mode:', 'InvoiceEngine', { error: err?.message || err });
      }

      await AuditRepository.log(
        schoolId,
        auditMeta.userId,
        auditMeta.userName,
        auditMeta.userRole,
        'CREATE_CREDIT_NOTE',
        'INVOICE_ENGINE',
        auditMeta.ipAddress || '127.0.0.1',
        `تم إصدار إشعار دائن رقم ${creditNoteId} للفاتورة ${originalInvoiceId} بقيمة ${amount} د.ل.`,
        { affectedRecord: originalInvoiceId }
      );

      return createdCN;
    });
  }

  /**
   * 7. Generates an adjustment Debit Note.
   * Used for scaling or increasing billing amount on historical documents.
   */
  public static async createDebitNote(
    schoolId: string,
    originalInvoiceId: string,
    amount: number,
    reason: string,
    meta?: AuditMetadata
  ): Promise<Invoice> {
    const auditMeta = this.getAuditMeta(meta);

    return await UnitOfWork.runInTransaction(schoolId, {
      operationName: `إنشاء إشعار مدين للفاتورة ${originalInvoiceId}`,
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      ipAddress: auditMeta.ipAddress || '127.0.0.1',
      tenantId: schoolId,
      affectedTables: ['invoices', 'journal_entries', 'general_ledger', 'students']
    } as any, async () => {
      const invoice = await InvoiceRepository.getById(schoolId, originalInvoiceId);
      if (!invoice) {
        throw new Error(`الفاتورة الأصلية غير موجودة: ${originalInvoiceId}`);
      }

      if (amount <= 0) {
        throw new Error("قيمة الإشعار المدين يجب أن تكون قيمة موجبة وأكبر من الصفر.");
      }

      // 1. Create a debit note document
      const debitNoteId = `DN-${Date.now()}`;
      const debitNote: Partial<Invoice> = {
        id: debitNoteId,
        studentId: invoice.studentId,
        studentName: invoice.studentName,
        amount: amount,
        totalAmount: amount,
        remainingAmount: amount,
        dueDate: new Date().toISOString().split('T')[0],
        status: 'Issued',
        item: `إشعار مدين زيادة قيمة الفاتورة ${invoice.invoiceNumber || invoice.id} - السبب: ${reason}`,
        taxAmount: 0,
        invoiceDate: new Date().toISOString().split('T')[0],
        schoolId,
        academicYearId: invoice.academicYearId,
        fiscalYearId: invoice.fiscalYearId,
        invoiceNumber: `DN-${invoice.invoiceNumber || invoice.id}`,
        references: [{
          type: 'debit_note',
          referenceId: originalInvoiceId,
          referenceNumber: invoice.invoiceNumber || originalInvoiceId
        }]
      };

      const createdDN = await InvoiceRepository.create(schoolId, debitNote);

      // 2. Adjust original invoice remaining balances
      const newRemaining = (invoice.remainingAmount ?? invoice.totalAmount ?? invoice.amount) + amount;
      const newTotal = (invoice.totalAmount ?? invoice.amount) + amount;
      
      const originalAudits = [...(invoice.audits || [])];
      originalAudits.push({
        id: `inv_aud_${Date.now()}_dn`,
        action: 'Debit Note',
        timestamp: new Date().toISOString(),
        userId: auditMeta.userId,
        userName: auditMeta.userName,
        details: `تطبيق إشعار مدين (زيادة) بقيمة ${amount} د.ل. الرقم: ${debitNoteId}`,
        ipAddress: auditMeta.ipAddress
      });

      await InvoiceRepository.update(schoolId, originalInvoiceId, {
        remainingAmount: newRemaining,
        totalAmount: newTotal,
        audits: originalAudits,
        version: invoice.version
      });

      // 2.5 Adjust installment schedules if there's any active plan
      try {
        const { InstallmentEngine } = await import('./InstallmentEngine');
        await InstallmentEngine.adjustPlanForInvoiceAmountChange(
          schoolId,
          originalInvoiceId,
          newTotal,
          auditMeta.userId,
          auditMeta.userName,
          `زيادة القيمة بسبب إصدار إشعار مدين بقيمة ${amount} د.ل.`
        );
      } catch (err: any) {
        EnterpriseLogger.warn('Installment plan adjustment failed or ignored during Debit Note issuance:', 'InvoiceEngine', { error: err?.message || err });
      }

      // 3. Increment student outstanding remaining balance
      const students = FallbackStorage.getStudents();
      const studIdx = students.findIndex(s => s.id === invoice.studentId);
      if (studIdx !== -1) {
        students[studIdx].feesRemaining += amount;
        FallbackStorage.saveStudents(students);
      }

      // 4. Adjust IFRS recognition
      try {
        await AcademicRevenueRecognitionEngine.handleAdjustment(
          schoolId,
          originalInvoiceId,
          'Fee Adjustment',
          newTotal,
          auditMeta.userId,
          auditMeta.userName,
          `تعديل آلي نتيجة إشعار مدين: ${reason}`
        );
      } catch (err: any) {
        EnterpriseLogger.warn('IFRS adjustment recognition failed:', 'InvoiceEngine', { error: err?.message || err });
      }

      // 5. Post accounting impact of Debit Note
      try {
        const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
        const debitAccount = config.revenueRecognition.deferredRevenueAccount;
        const creditAccount = config.revenueRecognition.earnedRevenueAccount;
        if (!debitAccount || !creditAccount) {
          throw new Error('ACCOUNTING DECISION REQUIRED: لا يوجد Mapping معتمد لإشعار المدين.');
        }
        
        const journalDraft = await PostingEngine.createJournalEntryDraft(schoolId, {
          schoolId,
          date: createdDN.invoiceDate,
          description: `قيد ترحيل إشعار مدين لتسوية وزيادة قيمة الفاتورة ${invoice.invoiceNumber || invoice.id}`,
          status: 'draft',
          items: [
            { accountId: debitAccount, debit: amount, credit: 0 },
            { accountId: creditAccount, debit: 0, credit: amount }
          ],
          totalDebit: amount,
          totalCredit: amount,
          referenceType: 'invoice',
          referenceId: originalInvoiceId,
          createdAt: new Date().toISOString()
        });

        await PostingEngine.postJournalEntry(schoolId, journalDraft.id, {
          userId: auditMeta.userId,
          userName: auditMeta.userName,
          userRole: auditMeta.userRole,
          ipAddress: auditMeta.ipAddress || '127.0.0.1'
        });
      } catch (err: any) {
        EnterpriseLogger.error('Failed to post debit note accounting ledger entries; transaction will roll back:', 'InvoiceEngine', { error: err?.message || err });
        throw err;
      }

      // Adjust with Accounts Receivable Engine using policy adjustment (correction)
      try {
        const { AccountsReceivableRepository } = await import('../repositories/AccountsReceivableRepository');
        const arAccount = await AccountsReceivableRepository.getAccountByStudentId(schoolId, invoice.studentId);
        if (arAccount) {
          const { AccountsReceivableEngine } = await import('./AccountsReceivableEngine');
          await AccountsReceivableEngine.processAdjustment(schoolId, arAccount.id, {
            type: 'correction',
            amount: amount, // Correction positive value increases total billed & outstanding
            reason: `إشعار مدين رقم ${debitNoteId}: ${reason}`,
            invoiceId: originalInvoiceId
          }, {
            userId: auditMeta.userId,
            userName: auditMeta.userName,
            userRole: auditMeta.userRole,
            ipAddress: auditMeta.ipAddress
          });
        }
      } catch (err: any) {
        if (FallbackStorage.isCanonicalPersistenceRequired()) {
          throw err;
        }
        EnterpriseLogger.warn('AR adjustment unavailable in local compatibility mode:', 'InvoiceEngine', { error: err?.message || err });
      }

      await AuditRepository.log(
        schoolId,
        auditMeta.userId,
        auditMeta.userName,
        auditMeta.userRole,
        'CREATE_DEBIT_NOTE',
        'INVOICE_ENGINE',
        auditMeta.ipAddress || '127.0.0.1',
        `تم إصدار إشعار مدين رقم ${debitNoteId} للفاتورة ${originalInvoiceId} بقيمة ${amount} د.ل.`,
        { affectedRecord: originalInvoiceId }
      );

      return createdDN;
    });
  }

  /**
   * 8. Cancels an Invoice.
   */
  public static async cancelInvoice(
    schoolId: string,
    invoiceId: string,
    reason: string,
    meta?: AuditMetadata
  ): Promise<Invoice> {
    const auditMeta = this.getAuditMeta(meta);
    const invoice = await InvoiceRepository.getById(schoolId, invoiceId);
    if (!invoice) {
      throw new Error(`الفاتورة غير موجودة: ${invoiceId}`);
    }

    InvoiceValidator.validateStateTransition(invoice.status, 'Cancelled');

    const history = [...(invoice.statusHistory || [])];
    history.push({
      id: `inv_sh_${Date.now()}`,
      fromStatus: invoice.status,
      toStatus: 'Cancelled',
      timestamp: new Date().toISOString(),
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      reason: `إلغاء الفاتورة: ${reason}`
    });

    const audits = [...(invoice.audits || [])];
    audits.push({
      id: `inv_aud_${Date.now()}`,
      action: 'Cancel',
      timestamp: new Date().toISOString(),
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      details: `إلغاء الفاتورة بالكامل. السبب: ${reason}`,
      ipAddress: auditMeta.ipAddress
    });

    // Reduce student outstanding balances if we cancelled an issued invoice
    if (invoice.status === 'Issued') {
      const students = FallbackStorage.getStudents();
      const studIdx = students.findIndex(s => s.id === invoice.studentId);
      if (studIdx !== -1) {
        students[studIdx].feesRemaining = Math.max(0, students[studIdx].feesRemaining - (invoice.totalAmount ?? invoice.amount));
        FallbackStorage.saveStudents(students);
      }

      // Reverse posted journal entry
      if (invoice.journalEntryId) {
        try {
          await PostingEngine.reversePostJournalEntry(schoolId, invoice.journalEntryId, {
            userId: auditMeta.userId,
            userName: auditMeta.userName,
            userRole: auditMeta.userRole,
            ipAddress: auditMeta.ipAddress || '127.0.0.1'
          });
        } catch (err: any) {
          EnterpriseLogger.warn('Reversal posting failed during invoice cancellation:', 'InvoiceEngine', { error: err?.message || err });
        }
      }

      // Update Accounts Receivable Subledger
      try {
        const { AccountsReceivableRepository } = await import('../repositories/AccountsReceivableRepository');
        const arAccount = await AccountsReceivableRepository.getAccountByStudentId(schoolId, invoice.studentId);
        if (arAccount) {
          const { AccountsReceivableEngine } = await import('./AccountsReceivableEngine');
          await AccountsReceivableEngine.processAdjustment(schoolId, arAccount.id, {
            type: 'waiver',
            amount: invoice.remainingAmount ?? invoice.totalAmount ?? invoice.amount,
            reason: `إلغاء الفاتورة رقم ${invoiceId}: ${reason}`,
            invoiceId: invoiceId
          }, {
            userId: auditMeta.userId,
            userName: auditMeta.userName,
            userRole: auditMeta.userRole,
            ipAddress: auditMeta.ipAddress
          });
        }
      } catch (err: any) {
        EnterpriseLogger.error('AR cancellation adjustment sync failed:', 'InvoiceEngine', { error: err?.message || err });
      }
    }

    const updated = await InvoiceRepository.update(schoolId, invoiceId, {
      status: 'Cancelled',
      statusHistory: history,
      audits: audits,
      version: invoice.version
    });

    await AuditRepository.log(
      schoolId,
      auditMeta.userId,
      auditMeta.userName,
      auditMeta.userRole,
      'CANCEL_INVOICE',
      'INVOICE_ENGINE',
      auditMeta.ipAddress || '127.0.0.1',
      `تم إلغاء الفاتورة ${invoiceId}. السبب: ${reason}`,
      { affectedRecord: invoiceId }
    );

    return updated;
  }

  /**
   * 9. Voids an Invoice.
   */
  public static async voidInvoice(
    schoolId: string,
    invoiceId: string,
    reason: string,
    meta?: AuditMetadata
  ): Promise<Invoice> {
    const auditMeta = this.getAuditMeta(meta);

    return await UnitOfWork.runInTransaction(schoolId, {
      operationName: `إبطال الفاتورة ${invoiceId}`,
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      ipAddress: auditMeta.ipAddress || '127.0.0.1',
      tenantId: schoolId,
      affectedTables: ['invoices', 'journal_entries', 'general_ledger', 'students']
    } as any, async () => {
      const invoice = await InvoiceRepository.getById(schoolId, invoiceId);
      if (!invoice) {
        throw new Error(`الفاتورة غير موجودة: ${invoiceId}`);
      }

      InvoiceValidator.validateStateTransition(invoice.status, 'Void');

      const history = [...(invoice.statusHistory || [])];
      history.push({
        id: `inv_sh_${Date.now()}`,
        fromStatus: invoice.status,
        toStatus: 'Void',
        timestamp: new Date().toISOString(),
        userId: auditMeta.userId,
        userName: auditMeta.userName,
        reason: `إبطال الفاتورة: ${reason}`
      });

      const audits = [...(invoice.audits || [])];
      audits.push({
        id: `inv_aud_${Date.now()}`,
        action: 'Void',
        timestamp: new Date().toISOString(),
        userId: auditMeta.userId,
        userName: auditMeta.userName,
        details: `إبطال وإلغاء فاعلية الفاتورة. السبب: ${reason}`,
        ipAddress: auditMeta.ipAddress
      });

      // Reduce student outstanding balances
      const students = FallbackStorage.getStudents();
      const studIdx = students.findIndex(s => s.id === invoice.studentId);
      if (studIdx !== -1) {
        students[studIdx].feesRemaining = Math.max(0, students[studIdx].feesRemaining - (invoice.remainingAmount ?? invoice.totalAmount ?? invoice.amount));
        FallbackStorage.saveStudents(students);
      }

      // Reverse journal entry if present
      if (invoice.journalEntryId) {
        try {
          await PostingEngine.reversePostJournalEntry(schoolId, invoice.journalEntryId, {
            userId: auditMeta.userId,
            userName: auditMeta.userName,
            userRole: auditMeta.userRole,
            ipAddress: auditMeta.ipAddress || '127.0.0.1'
          });
        } catch (err: any) {
          EnterpriseLogger.warn('Reversal posting failed during invoice voiding:', 'InvoiceEngine', { error: err?.message || err });
        }
      }

      // Update Accounts Receivable Subledger
      try {
        const { AccountsReceivableRepository } = await import('../repositories/AccountsReceivableRepository');
        const arAccount = await AccountsReceivableRepository.getAccountByStudentId(schoolId, invoice.studentId);
        if (arAccount) {
          const { AccountsReceivableEngine } = await import('./AccountsReceivableEngine');
          await AccountsReceivableEngine.processAdjustment(schoolId, arAccount.id, {
            type: 'waiver',
            amount: invoice.remainingAmount ?? invoice.totalAmount ?? invoice.amount,
            reason: `إبطال الفاتورة رقم ${invoiceId}: ${reason}`,
            invoiceId: invoiceId
          }, {
            userId: auditMeta.userId,
            userName: auditMeta.userName,
            userRole: auditMeta.userRole,
            ipAddress: auditMeta.ipAddress
          });
        }
      } catch (err: any) {
        EnterpriseLogger.error('AR void adjustment sync failed:', 'InvoiceEngine', { error: err?.message || err });
      }

      const updated = await InvoiceRepository.update(schoolId, invoiceId, {
        status: 'Void',
        statusHistory: history,
        audits: audits,
        version: invoice.version
      });

      await AuditRepository.log(
        schoolId,
        auditMeta.userId,
        auditMeta.userName,
        auditMeta.userRole,
        'VOID_INVOICE',
        'INVOICE_ENGINE',
        auditMeta.ipAddress || '127.0.0.1',
        `تم إبطال الفاتورة ${invoiceId}. السبب: ${reason}`,
        { affectedRecord: invoiceId }
      );

      return updated;
    });
  }

  /**
   * 10. Deletes an Invoice.
   * Blocked if used or contains any transaction or payments history.
   */
  public static async deleteInvoice(
    schoolId: string,
    invoiceId: string,
    meta?: AuditMetadata
  ): Promise<boolean> {
    const auditMeta = this.getAuditMeta(meta);
    const invoice = await InvoiceRepository.getById(schoolId, invoiceId);
    if (!invoice) return false;

    // Policy check: deletion is prohibited if used
    if (!InvoicePolicyService.canDelete(invoice)) {
      throw new Error("حظر السياسة: لا يمكن حذف الفاتورة لوجود حركات تابعة لها أو لتجاوزها مرحلة المسودة.");
    }

    const deleted = await InvoiceRepository.delete(schoolId, invoiceId);
    if (deleted) {
      await AuditRepository.log(
        schoolId,
        auditMeta.userId,
        auditMeta.userName,
        auditMeta.userRole,
        'DELETE_INVOICE',
        'INVOICE_ENGINE',
        auditMeta.ipAddress || '127.0.0.1',
        `حذف الفاتورة رقم ${invoiceId} بشكل نهائي من مستندات النظام.`,
        { affectedRecord: invoiceId }
      );
    }
    return deleted;
  }

  /**
   * 11. Sets up an installment plan for an issued invoice.
   * Delegates entirely to InstallmentEngine, adhering to the strict architectural decoupling constraint.
   */
  public static async generateInstallments(
    schoolId: string,
    invoiceId: string,
    params: {
      studentId: string;
      feeTemplateId: string;
      frequency: any;
      method: 'Equal' | 'Percentage' | 'Custom' | 'Manual' | 'Balloon';
      count: number;
      startDueDate: string;
      userId: string;
      userName: string;
    }
  ) {
    const { InstallmentEngine } = await import('./InstallmentEngine');
    return InstallmentEngine.createPlan({
      schoolId,
      studentId: params.studentId,
      invoiceId,
      feeTemplateId: params.feeTemplateId,
      frequency: params.frequency,
      method: params.method,
      count: params.count,
      startDueDate: params.startDueDate,
      userId: params.userId,
      userName: params.userName
    });
  }
}
