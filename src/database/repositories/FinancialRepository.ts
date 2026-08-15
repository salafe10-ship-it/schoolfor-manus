import { getSupabaseClient } from '../client';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { Invoice } from '../../types';
import { InvoiceValidator } from '../services/InvoiceValidator';
import { IBaseRepository } from './IBaseRepository';
import { AcademicRevenueRecognitionEngine } from '../services/AcademicRevenueRecognitionEngine';

/**
 * Repository class handling CRUD and data fetching operations for Invoices and Transactions.
 * Fully conforms to the IBaseRepository<Invoice> enterprise interface.
 */
export class FinancialRepository implements IBaseRepository<Invoice> {
  // Instance methods delegating to static methods for interface compliance

  /**
   * Retrieves an invoice by ID.
   */
  public async getById(schoolId: string, id: string): Promise<Invoice | null> {
    return FinancialRepository.getById(schoolId, id);
  }

  /**
   * Retrieves all invoices matching options.
   */
  public async getAll(schoolId: string, options?: any): Promise<Invoice[] | { data: Invoice[]; count: number }> {
    return FinancialRepository.getAll(schoolId, options);
  }

  /**
   * Creates a new invoice.
   */
  public async create(schoolId: string, item: Partial<Invoice>): Promise<Invoice> {
    return FinancialRepository.create(schoolId, item);
  }

  /**
   * Updates an existing invoice.
   */
  public async update(schoolId: string, id: string, item: Partial<Invoice>): Promise<Invoice> {
    return FinancialRepository.update(schoolId, id, item);
  }

  /**
   * Deletes an invoice.
   */
  public async delete(schoolId: string, id: string): Promise<boolean> {
    return FinancialRepository.delete(schoolId, id);
  }

  /**
   * Checks if an invoice exists.
   */
  public async exists(schoolId: string, id: string): Promise<boolean> {
    return FinancialRepository.exists(schoolId, id);
  }

  /**
   * Counts invoices matching options.
   */
  public async count(schoolId: string, options?: any): Promise<number> {
    return FinancialRepository.count(schoolId, options);
  }

  // --- Static Methods ---

  /**
   * Checks if a student has any unpaid invoices.
   */
  public static async hasOutstandingInvoices(schoolId: string, studentId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const { data, error } = await supabase.from('invoices').select('id').eq('student_id', studentId).eq('status', 'unpaid');
    return error ? false : (data && data.length > 0);
  }

  /**
   * Retrieves an invoice by its unique ID.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique invoice identifier ID.
   */
  public static async getById(schoolId: string, id: string): Promise<Invoice | null> {
    return this.getInvoiceById(id);
  }

  /**
   * Retrieves all invoices with optional paging.
   * @param schoolId - School enterprise tenant ID.
   * @param options - Paging/filtering options.
   */
  public static async getAll(
    schoolId: string,
    options?: { status?: string; studentId?: string; search?: string; page?: number; limit?: number }
  ): Promise<Invoice[] | { data: Invoice[]; count: number }> {
    return this.getAllInvoices(schoolId, options);
  }

  /**
   * Creates a new invoice.
   * @param schoolId - School enterprise tenant ID.
   * @param item - Partial invoice details.
   */
  public static async create(schoolId: string, item: Partial<Invoice>): Promise<Invoice> {
    const created = await this.createInvoice(item);
    try {
      await AcademicRevenueRecognitionEngine.generateSchedule(schoolId, created.id, 'system_rev_rec', 'System Recognition Engine');
    } catch (err: any) {
      EnterpriseLogger.warn('Could not auto-generate revenue recognition schedule:', "FinancialRepository", { details: err.message });
    }
    return created;
  }

  /**
   * Updates an existing invoice.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique invoice ID.
   * @param item - Invoice updates.
   */
  public static async update(schoolId: string, id: string, item: Partial<Invoice>): Promise<Invoice> {
    const updated = await this.updateInvoice(id, item);
    if (item.totalAmount !== undefined || item.amount !== undefined) {
      const newTotal = item.totalAmount ?? item.amount ?? 0;
      try {
        await AcademicRevenueRecognitionEngine.handleAdjustment(
          schoolId,
          id,
          'Fee Adjustment',
          newTotal,
          'system_rev_rec',
          'System Recognition Engine',
          'تعديل تلقائي لقيمة الفاتورة ومراجعة الجدولة'
        );
      } catch (err: any) {
        EnterpriseLogger.warn('Could not auto-adjust revenue recognition schedules:', "FinancialRepository", { details: err.message });
      }
    }
    return updated;
  }

  /**
   * Deletes an invoice by its ID.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique invoice ID.
   */
  public static async delete(schoolId: string, id: string): Promise<boolean> {
    return this.deleteInvoice(id);
  }

  /**
   * Verifies if an invoice exists.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique invoice ID.
   */
  public static async exists(schoolId: string, id: string): Promise<boolean> {
    const invoice = await this.getById(schoolId, id);
    return invoice !== null;
  }

  /**
   * Counts matching invoices.
   * @param schoolId - School enterprise tenant ID.
   * @param options - Filtering parameters.
   */
  public static async count(schoolId: string, options?: any): Promise<number> {
    const res = await this.getAll(schoolId, options);
    if (Array.isArray(res)) {
      return res.length;
    }
    return res.count;
  }

  // --- Original Custom Invoices CRUD ---

  /**
   * Core implementation for getting all invoices under tenant isolation.
   */
  public static async getAllInvoices(
    schoolId: string, 
    options?: { status?: string; studentId?: string; search?: string; page?: number; limit?: number }
  ): Promise<{ data: Invoice[]; count: number }> {
    const supabase = getSupabaseClient();
    const page = options?.page || 1;
    const limit = options?.limit || 50;

    if (supabase) {
      try {
        let query = supabase
          .from('invoices')
          .select('*, students!inner(school_id)', { count: 'exact' })
          .eq('students.school_id', schoolId);

        if (options?.status) {
          query = query.eq('status', options.status);
        }
        if (options?.studentId) {
          query = query.eq('student_id', options.studentId);
        }
        if (options?.search) {
          query = query.ilike('student_name', `%${options.search}%`);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to).order('invoice_date', { ascending: false });

        const { data, count, error } = await query;
        if (!error && data) {
          return { data: data as Invoice[], count: count || data.length };
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to query invoices from Supabase:", "FinancialRepository", { error: err });
      }
    }

    // Fallback
    const schoolStudents = FallbackStorage.getStudents().filter(s => s.schoolId === schoolId);
    const studentIds = new Set(schoolStudents.map(s => s.id));

    let invoices = FallbackStorage.getInvoices().filter(inv => studentIds.has(inv.studentId));

    if (options?.status) {
      invoices = invoices.filter(inv => inv.status === options.status);
    }
    if (options?.studentId) {
      invoices = invoices.filter(inv => inv.studentId === options.studentId);
    }
    if (options?.search) {
      const sLower = options.search.toLowerCase();
      invoices = invoices.filter(inv => inv.studentName.toLowerCase().includes(sLower));
    }

    const count = invoices.length;
    const from = (page - 1) * limit;
    const data = invoices.slice(from, from + limit);

    return { data, count };
  }

  /**
   * Fetches an invoice by ID.
   */
  public static async getInvoiceById(id: string): Promise<Invoice | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) return data as Invoice;
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch invoice:", "FinancialRepository", { error: err });
      }
    }

    const invoice = FallbackStorage.getInvoices().find(inv => inv.id === id);
    return invoice || null;
  }

  /**
   * Creates a new invoice with full validation.
   */
  public static async createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const id = invoiceData.id || `inv_${Date.now()}`;
    const newInvoice: Invoice = {
      ...(invoiceData as any),
      id,
      status: invoiceData.status || 'unpaid',
      amount: invoiceData.amount || 0,
      taxAmount: invoiceData.taxAmount || 0,
      invoiceDate: invoiceData.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: invoiceData.dueDate || new Date().toISOString().split('T')[0]
    };

    // Validate invoice before reaching repository database/storage layers
    await InvoiceValidator.validate(newInvoice);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .insert([newInvoice])
          .select()
          .single();
        if (!error && data) return data as Invoice;
      } catch (err: any) {
        EnterpriseLogger.error("Failed to create invoice in Supabase:", "FinancialRepository", { error: err });
      }
    }

    const all = FallbackStorage.getInvoices();
    all.unshift(newInvoice);
    FallbackStorage.saveInvoices(all);
    return newInvoice;
  }

  /**
   * Updates an existing invoice with full validation.
   */
  public static async updateInvoice(id: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
    const existing = await this.getInvoiceById(id);
    const updatedState = { ...existing, ...invoiceData };

    // Validate invoice update before writing to databases/storages
    await InvoiceValidator.validate(updatedState);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as Invoice;
      } catch (err: any) {
        EnterpriseLogger.error("Failed to update invoice:", "FinancialRepository", { error: err });
      }
    }

    const all = FallbackStorage.getInvoices();
    const idx = all.findIndex(inv => inv.id === id);
    if (idx === -1) {
      throw new Error(`Invoice ${id} not found`);
    }

    const updated = { ...all[idx], ...invoiceData };
    all[idx] = updated;
    FallbackStorage.saveInvoices(all);
    return updated;
  }

  /**
   * Deletes an invoice.
   */
  public static async deleteInvoice(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', id);
        if (!error) return true;
      } catch (err: any) {
        EnterpriseLogger.error("Failed to delete invoice:", "FinancialRepository", { error: err });
      }
    }

    const all = FallbackStorage.getInvoices();
    const filtered = all.filter(inv => inv.id !== id);
    if (filtered.length === all.length) return false;

    FallbackStorage.saveInvoices(filtered);
    return true;
  }
}
