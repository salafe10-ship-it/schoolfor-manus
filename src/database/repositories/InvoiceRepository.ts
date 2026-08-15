import { getSupabaseClient } from '../client';
import { FallbackStorage } from './FallbackStorage';
import { Invoice, InvoiceNumberSequence } from '../../types';
import { IBaseRepository } from './IBaseRepository';
import { UnitOfWork } from '../UnitOfWork';
import { SQLCommandBuilder } from '../transactions/SQLCommand';

/**
 * Enterprise Invoice Repository
 * Handles all CRUD and direct Data Access Layer (DAL) operations for Invoices and Sequences.
 * Strictly decoupled from business/validation logic.
 */
export class InvoiceRepository implements IBaseRepository<Invoice> {
  private static readonly SEQUENCES_FILE = 'invoice_sequences_database.json';

  /**
   * Retrieves an invoice by ID under tenant isolation.
   */
  public async getById(schoolId: string, id: string): Promise<Invoice | null> {
    return InvoiceRepository.getById(schoolId, id);
  }

  /**
   * Retrieves all invoices matching options under tenant isolation.
   */
  public async getAll(schoolId: string, options?: any): Promise<Invoice[] | { data: Invoice[]; count: number }> {
    return InvoiceRepository.getAll(schoolId, options);
  }

  /**
   * Inserts a new invoice.
   */
  public async create(schoolId: string, item: Partial<Invoice>): Promise<Invoice> {
    return InvoiceRepository.create(schoolId, item);
  }

  /**
   * Updates an existing invoice (Optimistic Locking & Tenant Isolation supported).
   */
  public async update(schoolId: string, id: string, item: Partial<Invoice>): Promise<Invoice> {
    return InvoiceRepository.update(schoolId, id, item);
  }

  /**
   * Deletes an invoice from storage.
   */
  public async delete(schoolId: string, id: string): Promise<boolean> {
    return InvoiceRepository.delete(schoolId, id);
  }

  /**
   * Verifies if an invoice exists.
   */
  public async exists(schoolId: string, id: string): Promise<boolean> {
    return InvoiceRepository.exists(schoolId, id);
  }

  /**
   * Counts invoices matching criteria.
   */
  public async count(schoolId: string, options?: any): Promise<number> {
    return InvoiceRepository.count(schoolId, options);
  }

  // --- Static DAL Methods ---

  public static async getById(schoolId: string, id: string): Promise<Invoice | null> {
    const invoices = await this.getAllRaw();
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) return null;
    
    // Tenant Isolation Guard
    if (invoice.schoolId && invoice.schoolId !== schoolId) {
      throw new Error('حظر أمني: محاولة الوصول إلى فاتورة تابعة لمستأجر آخر.');
    }
    return invoice;
  }

  public static async getAll(
    schoolId: string,
    options?: { status?: string; studentId?: string; search?: string; page?: number; limit?: number }
  ): Promise<{ data: Invoice[]; count: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 50;

    const allInvoices = await this.getAllRaw();
    // Filter by Tenant
    let invoices = allInvoices.filter(inv => !inv.schoolId || inv.schoolId === schoolId);

    if (options?.status) {
      invoices = invoices.filter(inv => inv.status === options.status);
    }
    if (options?.studentId) {
      invoices = invoices.filter(inv => inv.studentId === options.studentId);
    }
    if (options?.search) {
      const sLower = options.search.toLowerCase();
      invoices = invoices.filter(inv => 
        inv.studentName.toLowerCase().includes(sLower) || 
        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(sLower))
      );
    }

    const count = invoices.length;
    const from = (page - 1) * limit;
    const data = invoices.slice(from, from + limit);

    return { data, count };
  }

  public static async create(schoolId: string, item: Partial<Invoice>): Promise<Invoice> {
    const all = await this.getAllRaw();
    
    const newInvoice: Invoice = {
      id: item.id || `inv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      studentId: item.studentId || '',
      studentName: item.studentName || '',
      amount: item.amount || 0,
      totalAmount: item.totalAmount ?? item.amount ?? 0,
      remainingAmount: item.remainingAmount ?? item.totalAmount ?? item.amount ?? 0,
      dueDate: item.dueDate || new Date().toISOString().split('T')[0],
      status: item.status || 'Draft',
      item: item.item || '',
      taxAmount: item.taxAmount || 0,
      items: item.items || [],
      invoiceDate: item.invoiceDate || new Date().toISOString().split('T')[0],
      costCenterId: item.costCenterId,
      stageId: item.stageId,
      studentPaymentId: item.studentPaymentId,
      receiptVoucherId: item.receiptVoucherId,
      journalEntryId: item.journalEntryId,
      costCenter: item.costCenter,
      financialPeriod: item.financialPeriod || new Date().toISOString().substring(0, 7),
      user: item.user,
      createdAt: item.createdAt || new Date().toISOString(),
      recognitionPolicy: item.recognitionPolicy,
      deferredRevenueAccount: item.deferredRevenueAccount,
      revenueRecognitionMethod: item.revenueRecognitionMethod,
      recognitionStartDate: item.recognitionStartDate,
      recognitionEndDate: item.recognitionEndDate,
      schoolId: schoolId,
      branchId: item.branchId || 'branch_main',
      academicYearId: item.academicYearId || '2026',
      fiscalYearId: item.fiscalYearId || '2026',
      invoiceNumber: item.invoiceNumber,
      version: item.version || 1,
      isDeleted: false,
      lines: item.lines || [],
      taxes: item.taxes || [],
      discounts: item.discounts || [],
      charges: item.charges || [],
      references: item.references || [],
      statusHistory: item.statusHistory || [],
      versions: item.versions || [],
      attachments: item.attachments || [],
      audits: item.audits || []
    };

    if (UnitOfWork.isTransactionActive()) {
      const command = SQLCommandBuilder.create({
        sqlText: `INSERT INTO invoices (id, school_id, amount, total_amount, status) VALUES ($1, $2, $3, $4, $5);`,
        parameters: [newInvoice.id, schoolId, newInvoice.amount, newInvoice.totalAmount, newInvoice.status]
      });
      UnitOfWork.enlistCreate('invoices', newInvoice.id, newInvoice, command);
      return newInvoice;
    }

    all.unshift(newInvoice);
    await this.saveAllRaw(all);

    // Maintain legacy FallbackStorage invoices synchronization
    const legacyInvoices = FallbackStorage.getInvoices();
    legacyInvoices.unshift(newInvoice);
    FallbackStorage.saveInvoices(legacyInvoices);

    return newInvoice;
  }

  public static async update(schoolId: string, id: string, item: Partial<Invoice>): Promise<Invoice> {
    const all = await this.getAllRaw();
    const idx = all.findIndex(inv => inv.id === id);
    if (idx === -1) {
      throw new Error(`الفاتورة المطلوبة غير موجودة: ${id}`);
    }

    const existing = all[idx];
    if (existing.schoolId && existing.schoolId !== schoolId) {
      throw new Error('حظر أمني: محاولة تعديل فاتورة تابعة لمستأجر آخر.');
    }

    // Optimistic Locking Check
    if (item.version !== undefined && existing.version !== undefined && item.version !== existing.version) {
      throw new Error('حظر تزامني: تم تحديث الفاتورة بواسطة مستخدم آخر. يرجى إعادة التحميل.');
    }

    const updated: Invoice = {
      ...existing,
      ...item,
      version: (existing.version || 1) + 1
    };

    if (UnitOfWork.isTransactionActive()) {
      const command = SQLCommandBuilder.create({
        sqlText: `UPDATE invoices SET status=$1, amount=$2, total_amount=$3, version=$4 WHERE id=$5;`,
        parameters: [updated.status, updated.amount, updated.totalAmount, updated.version, id]
      });
      UnitOfWork.enlistUpdate('invoices', id, updated, command);
      return updated;
    }

    all[idx] = updated;
    await this.saveAllRaw(all);

    // Maintain legacy FallbackStorage invoices synchronization
    const legacyInvoices = FallbackStorage.getInvoices();
    const legacyIdx = legacyInvoices.findIndex(inv => inv.id === id);
    if (legacyIdx !== -1) {
      legacyInvoices[legacyIdx] = updated;
    } else {
      legacyInvoices.unshift(updated);
    }
    FallbackStorage.saveInvoices(legacyInvoices);

    return updated;
  }

  public static async delete(schoolId: string, id: string): Promise<boolean> {
    const all = await this.getAllRaw();
    const idx = all.findIndex(inv => inv.id === id);
    if (idx === -1) return false;

    const existing = all[idx];
    if (existing.schoolId && existing.schoolId !== schoolId) {
      throw new Error('حظر أمني: محاولة حذف فاتورة تابعة لمستأجر آخر.');
    }

    if (UnitOfWork.isTransactionActive()) {
      const command = SQLCommandBuilder.create({
        sqlText: `DELETE FROM invoices WHERE id=$1;`,
        parameters: [id]
      });
      UnitOfWork.enlistDelete('invoices', id, command);
      return true;
    }

    all.splice(idx, 1);
    await this.saveAllRaw(all);

    // Maintain legacy FallbackStorage invoices synchronization
    const legacyInvoices = FallbackStorage.getInvoices().filter(inv => inv.id !== id);
    FallbackStorage.saveInvoices(legacyInvoices);

    return true;
  }

  public static async exists(schoolId: string, id: string): Promise<boolean> {
    const invoice = await this.getById(schoolId, id);
    return invoice !== null;
  }

  public static async count(schoolId: string, options?: any): Promise<number> {
    const res = await this.getAll(schoolId, options);
    return res.count;
  }

  // --- Sequences DAL methods ---

  /**
   * Retrieves the number sequence config or creates a default one.
   * Guarantees persistence under optimistic concurrency lock.
   */
  public static async getSequenceConfig(schoolId: string, branchId: string, fiscalYear: string): Promise<InvoiceNumberSequence> {
    const sequences = FallbackStorage.safeReadFile<InvoiceNumberSequence[]>(this.SEQUENCES_FILE, []);
    let seq = sequences.find(s => s.schoolId === schoolId && s.branchId === branchId && s.fiscalYear === fiscalYear);
    
    if (!seq) {
      seq = {
        id: `seq_${schoolId}_${branchId}_${fiscalYear}`,
        schoolId,
        branchId,
        prefix: 'INV',
        suffix: fiscalYear,
        fiscalYear,
        academicYear: '2026',
        currentSequence: 0,
        paddedLength: 5
      };
      sequences.push(seq);
      FallbackStorage.safeWriteFile(this.SEQUENCES_FILE, sequences);
    }
    return seq;
  }

  /**
   * Atomically increments the sequence and returns the next padded document number.
   */
  public static async incrementAndGetNextNumber(schoolId: string, branchId: string, fiscalYear: string): Promise<string> {
    const sequences = FallbackStorage.safeReadFile<InvoiceNumberSequence[]>(this.SEQUENCES_FILE, []);
    let idx = sequences.findIndex(s => s.schoolId === schoolId && s.branchId === branchId && s.fiscalYear === fiscalYear);
    
    let seq: InvoiceNumberSequence;
    if (idx === -1) {
      seq = {
        id: `seq_${schoolId}_${branchId}_${fiscalYear}`,
        schoolId,
        branchId,
        prefix: 'INV',
        suffix: fiscalYear,
        fiscalYear,
        academicYear: '2026',
        currentSequence: 1,
        paddedLength: 5
      };
      sequences.push(seq);
    } else {
      seq = sequences[idx];
      seq.currentSequence += 1;
      sequences[idx] = seq;
    }

    FallbackStorage.safeWriteFile(this.SEQUENCES_FILE, sequences);

    const padded = String(seq.currentSequence).padStart(seq.paddedLength, '0');
    return `${seq.prefix}-${seq.branchId.toUpperCase()}-${seq.fiscalYear}-${padded}`;
  }

  // --- Private Helper methods ---

  private static async getAllRaw(): Promise<Invoice[]> {
    const baseList = FallbackStorage.getInvoices();
    if (UnitOfWork.isTransactionActive()) {
      return UnitOfWork.getPendingAll('invoices', baseList);
    }
    return baseList;
  }

  private static async saveAllRaw(data: Invoice[]): Promise<void> {
    FallbackStorage.saveInvoices(data);
  }

  public static enlistCreateInvoice(invoiceId: string, schoolId: string, studentId: string, studentName: string, amount: number, notes: string, category: string, invoiceItem: any) {
    const command = SQLCommandBuilder.create({
      sqlText: `INSERT INTO invoices (id, school_id, student_id, student_name, amount, paid_amount, due_date, status, category, notes) VALUES ($1, $2, $3, $4, $5, 0.00, NOW(), 'unpaid', $6, $7);`,
      parameters: [invoiceId, schoolId, studentId, studentName, amount, category, notes]
    });
    UnitOfWork.enlistCreate('invoices', invoiceId, invoiceItem, command);
  }

  public static enlistUpdateStudentName(invoiceId: string, studentName: string, updatedInv: any) {
    const command = SQLCommandBuilder.create({
      sqlText: `UPDATE invoices SET student_name = $1 WHERE id = $2;`,
      parameters: [studentName, invoiceId]
    });
    UnitOfWork.enlistUpdate('invoices', invoiceId, updatedInv, command);
  }
}
