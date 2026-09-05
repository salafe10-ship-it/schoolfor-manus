const isServer = typeof window === 'undefined';

let fs: any = null;
let path: any = null;
let DATA_DIR = '';

import { 
  schoolsSeed, 
  branchesSeed, 
  classesSeed, 
  studentsSeed, 
  teachersSeed, 
  employeesSeed, 
  invoicesSeed, 
  inventorySeed, 
  busRoutesSeed, 
  auditLogsSeed,
  initialAttendance,
  stagesSeed,
  costCentersSeed,
  gradesSeed,
  academicClassesSeed
} from '../seed/mockData';
import { Student, Invoice, Exam, Employee, Teacher, InventoryItem, BusRoute, AuditLog, Attendance, JournalEntry, Voucher, Account, FiscalYear, AccountingPeriod, GeneralLedger, InstallmentPlan, InstallmentSchedule, InstallmentItem, InstallmentPayment, InstallmentHistory, InstallmentVersion, AcademicCalendar, AcademicTerm, AcademicPeriod, RevenueRecognitionPolicy, RevenueRecognitionSchedule, RevenueRecognitionEntry, RevenueRecognitionHistory, RevenueRecognitionAdjustment, FinancialConfiguration, FinancialConfigurationAuditLog, ReceivableAccount, ReceivableTransaction, ReceivableBalance, ReceivableAllocation, ReceivableSettlement, ReceivableAdjustment, ReceivableWriteOff, ReceivableStatusHistory, ReceivableAudit, CollectionCase, CollectionPromise, CollectionReceipt, CollectionAllocation, TreasuryAccount, TreasuryTransaction, PaymentInstrumentConfig, TreasuryTransfer } from '../../types';
import { KPIDefinition, DashboardDefinition } from '../../types';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { getSupabaseClient } from '../client';

function ensureDirectoryExists(filePath: string) {
  if (!isServer || !fs || !path) return;
  const dirname = path.dirname(filePath);
  if (!fs?.existsSync(dirname)) {
    fs?.mkdirSync(dirname, { recursive: true });
  }
}

export interface QueueItem {
  id: string;
  timestamp: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  recordId: string;
  data: any;
  schoolId: string;
  auditContext?: {
    userId: string;
    userName: string;
    userRole: string;
    ipAddress: string;
    details: string;
  };
}

export type CanonicalPersistenceFailureCode = 'PERSISTENCE_UNAVAILABLE' | 'PERSISTENCE_UNKNOWN';

export class CanonicalPersistenceError extends Error {
  public readonly code: CanonicalPersistenceFailureCode;
  public readonly canonicalSource = 'supabase';

  public constructor(code: CanonicalPersistenceFailureCode, message: string) {
    super(message);
    this.name = 'CanonicalPersistenceError';
    this.code = code;
  }
}

export class FallbackStorage {
  private static students: Student[] = [];
  private static invoices: Invoice[] = [];
  private static exams: any = {};
  private static teachers: Teacher[] = [];
  private static employees: Employee[] = [];
  private static inventory: InventoryItem[] = [];
  private static buses: BusRoute[] = [];
  private static auditLogs: AuditLog[] = [];
  private static attendance: Attendance[] = [];
  private static uniforms: any[] = [];
  private static library: any[] = [];
  
  private static guardians: any[] = [];
  private static student_guardians: any[] = [];
  private static student_medical_records: any[] = [];
  private static student_transportation: any[] = [];
  private static student_library_accounts: any[] = [];
  private static student_uniform_accounts: any[] = [];
  private static student_assets: any[] = [];
  private static student_documents: any[] = [];
  private static student_contacts: any[] = [];
  
  private static journalEntries: JournalEntry[] = [];
  private static vouchers: Voucher[] = [];
  private static accounts: Account[] = [];
  private static fiscalYears: FiscalYear[] = [];
  private static accountingPeriods: AccountingPeriod[] = [];
  private static generalLedgerLines: GeneralLedger[] = [];
  
  private static installmentPlans: InstallmentPlan[] = [];
  private static installmentSchedules: InstallmentSchedule[] = [];
  private static installmentItems: InstallmentItem[] = [];
  private static installmentPayments: InstallmentPayment[] = [];
  private static installmentHistories: InstallmentHistory[] = [];
  private static installmentVersions: InstallmentVersion[] = [];

  private static academicCalendars: AcademicCalendar[] = [];
  private static academicTerms: AcademicTerm[] = [];
  private static academicPeriods: AcademicPeriod[] = [];
  private static recognitionPolicies: RevenueRecognitionPolicy[] = [];
  private static recognitionSchedules: RevenueRecognitionSchedule[] = [];
  private static recognitionEntries: RevenueRecognitionEntry[] = [];
  private static recognitionHistories: RevenueRecognitionHistory[] = [];
  private static recognitionAdjustments: RevenueRecognitionAdjustment[] = [];
  private static financialConfigurations: FinancialConfiguration[] = [];
  private static financialConfigurationAuditLogs: FinancialConfigurationAuditLog[] = [];
  
  private static receivableAccounts: ReceivableAccount[] = [];
  private static receivableTransactions: ReceivableTransaction[] = [];
  private static receivableBalances: ReceivableBalance[] = [];
  private static receivableAllocations: ReceivableAllocation[] = [];
  private static receivableSettlements: ReceivableSettlement[] = [];
  private static receivableAdjustments: ReceivableAdjustment[] = [];
  private static receivableWriteOffs: ReceivableWriteOff[] = [];
  private static receivableStatusHistories: ReceivableStatusHistory[] = [];
  private static receivableAudits: ReceivableAudit[] = [];
  private static collectionCases: CollectionCase[] = [];
  private static collectionPromises: CollectionPromise[] = [];
  private static collectionReceipts: CollectionReceipt[] = [];
  private static collectionAllocations: CollectionAllocation[] = [];
  
  private static treasuryAccounts: TreasuryAccount[] = [];
  private static treasuryTransactions: TreasuryTransaction[] = [];
  private static paymentInstrumentConfigs: PaymentInstrumentConfig[] = [];
  private static treasuryTransfers: TreasuryTransfer[] = [];
  
  private static mdmRegistry: any[] = [];
  private static logs: any[] = [];
  private static notifications: any[] = [];
  private static reportDefinitions: any[] = [];
  private static systemGLMappings: any[] = [];
  private static templateAccounts: any[] = [];
  private static tenants: any[] = [];
  private static users: any[] = [];
  private static workflowDefinitions: any[] = [];
  private static workflowInstances: any[] = [];
  
  private static kpiDefinitions: KPIDefinition[] = [];
  private static dashboardDefinitions: DashboardDefinition[] = [];
  
  private static backgroundJobs: any[] = [];
  private static backupDefinitions: any[] = [];
  private static coaTemplates: any[] = [];
  private static dmsDocuments: any[] = [];
  private static apiConfigurations: any[] = [];
  
  private static aiModels: any[] = [];
  private static promptTemplates: any[] = [];
  
  private static initialized = false;
  private static cachedHealth: boolean | null = null;
  private static lastHealthCheckTime = 0;

  /**
   * A configured Supabase runtime is canonical. Local JSON/localStorage is
   * retained only for an explicitly unconfigured local compatibility mode;
   * it must never impersonate production persistence.
   */
  public static isCanonicalPersistenceRequired(): boolean {
    const runtime = typeof process !== 'undefined' ? process.env : {};
    // Do not read Vite's import.meta contract from the Node CommonJS bundle.
    // A non-local browser origin is the production-like signal here; explicit
    // EDUPRO_* variables still remain authoritative for server-side startup.
    const browserProduction = typeof window !== 'undefined'
      && !['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
    const supabaseUrl = runtime?.SUPABASE_URL;
    const supabaseKey = runtime?.SUPABASE_ANON_KEY;
    const hasConfiguredSupabase = Boolean(
      supabaseUrl &&
      supabaseKey &&
      !supabaseUrl.includes('your-project') &&
      !supabaseKey.includes('your-anon-key')
    );

    return browserProduction ||
      runtime?.NODE_ENV === 'production' ||
      runtime?.EDUPRO_ENVIRONMENT === 'staging' ||
      runtime?.EDUPRO_PERSISTENCE_MODE === 'canonical' ||
      hasConfiguredSupabase;
  }

  public static assertCanonicalPersistence(operation: string): void {
    if (this.isCanonicalPersistenceRequired()) {
      throw new CanonicalPersistenceError(
        'PERSISTENCE_UNKNOWN',
        `Canonical Supabase persistence was not confirmed for ${operation}; local fallback is not an authoritative result.`
      );
    }
  }

  private static getFilePath(filename: string): string {
    if (!isServer || !path) return '';
    return path.join(DATA_DIR, filename);
  }

  public static safeReadFile<T>(filename: string, defaultVal: T): T {
    if (!isServer) {
      try {
        const key = `school_db_${filename}`;
        const item = localStorage.getItem(key);
        if (item) {
          return JSON.parse(item);
        }
      } catch (err: any) {
        EnterpriseLogger.error(`Error reading ${filename} from localStorage:`, "FallbackStorage", { error: err });
      }
      return defaultVal;
    }

    const file = this.getFilePath(filename);
    try {
      if (fs?.existsSync(file)) {
        const raw = fs?.readFileSync(file, 'utf8') || '';
        return JSON.parse(raw);
      }
    } catch (err: any) {
      EnterpriseLogger.error(`Error reading ${filename}:`, "FallbackStorage", { error: err });
    }
    return defaultVal;
  }

  public static safeWriteFile<T>(filename: string, data: T) {
    if (!isServer) {
      try {
        const key = `school_db_${filename}`;
        localStorage.setItem(key, JSON.stringify(data));
      } catch (err: any) {
        EnterpriseLogger.error(`Error writing ${filename} to localStorage:`, "FallbackStorage", { error: err });
      }
      return;
    }

    const file = this.getFilePath(filename);
    try {
      ensureDirectoryExists(file);
      fs?.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    } catch (err: any) {
      EnterpriseLogger.error(`Error writing ${filename}:`, "FallbackStorage", { error: err });
    }
  }

  public static async initialize() {
    if (this.initialized) return;

    if (isServer) {
      try {
        const fsName = 'fs';
        const pathName = 'path';
        const fsMod = await import(/* @vite-ignore */ fsName);
        fs = fsMod.default || fsMod;
        const pathMod = await import(/* @vite-ignore */ pathName);
        path = pathMod.default || pathMod;
        DATA_DIR = path.join(process.cwd(), 'src', 'db');
      } catch (err: any) {
        EnterpriseLogger.error("Failed to load fs/path on server:", "FallbackStorage", { error: err });
      }
    }

    // Load or seed Students
    const studentDbFile = 'students_database.json';
    const studentsFromFile = this.safeReadFile<Student[]>(studentDbFile, []);
    if (studentsFromFile.length > 0) {
      this.students = studentsFromFile;
    } else {
      this.students = [];
      this.safeWriteFile(studentDbFile, this.students);
    }

    // Load or seed Exams
    const examDbFile = 'exams_database.json';
    const examsFromFile = this.safeReadFile<any>(examDbFile, null);
    if (examsFromFile && Object.keys(examsFromFile).length > 0) {
      this.exams = examsFromFile;
    } else {
      this.exams = { examTemplates: [] };
      this.safeWriteFile(examDbFile, this.exams);
    }

    // Load other files or fall back to seeds
    this.invoices = this.safeReadFile<Invoice[]>('invoices_database.json', []);
    this.teachers = this.safeReadFile<Teacher[]>('teachers_database.json', []);
    this.employees = this.safeReadFile<Employee[]>('employees_database.json', []);
    this.inventory = this.safeReadFile<InventoryItem[]>('inventory_database.json', []);
    this.buses = this.safeReadFile<BusRoute[]>('buses_database.json', []);
    this.auditLogs = this.safeReadFile<AuditLog[]>('auditlogs_database.json', []);
    this.attendance = this.safeReadFile<Attendance[]>('attendance_database.json', []);
    
    // Uniforms local storage seed
    this.uniforms = this.safeReadFile<any[]>('uniforms_database.json', []);

    // Library local storage seed
    this.library = this.safeReadFile<any[]>('library_database.json', []);

    this.guardians = this.safeReadFile<any[]>('guardians_database.json', []);
    this.student_guardians = this.safeReadFile<any[]>('student_guardians_database.json', []);
    this.student_medical_records = this.safeReadFile<any[]>('student_medical_records_database.json', []);
    this.student_transportation = this.safeReadFile<any[]>('student_transportation_database.json', []);
    this.student_library_accounts = this.safeReadFile<any[]>('student_library_accounts_database.json', []);
    this.student_uniform_accounts = this.safeReadFile<any[]>('student_uniform_accounts_database.json', []);
    this.student_assets = this.safeReadFile<any[]>('student_assets_database.json', []);
    this.student_documents = this.safeReadFile<any[]>('student_documents_database.json', []);
    this.student_contacts = this.safeReadFile<any[]>('student_contacts_database.json', []);

    this.journalEntries = this.safeReadFile<JournalEntry[]>('journal_entries_database.json', []);
    this.vouchers = this.safeReadFile<Voucher[]>('vouchers_database.json', []);

    this.accounts = this.safeReadFile<Account[]>('accounts_database.json', []);
    this.fiscalYears = this.safeReadFile<FiscalYear[]>('fiscal_years_database.json', []);
    this.accountingPeriods = this.safeReadFile<AccountingPeriod[]>('accounting_periods_database.json', []);
    this.generalLedgerLines = this.safeReadFile<GeneralLedger[]>('general_ledger_database.json', []);
    
    this.installmentPlans = this.safeReadFile<InstallmentPlan[]>('installment_plans_database.json', []);
    this.installmentSchedules = this.safeReadFile<InstallmentSchedule[]>('installment_schedules_database.json', []);
    this.installmentItems = this.safeReadFile<InstallmentItem[]>('installment_items_database.json', []);
    this.installmentPayments = this.safeReadFile<InstallmentPayment[]>('installment_payments_database.json', []);
    this.installmentHistories = this.safeReadFile<InstallmentHistory[]>('installment_histories_database.json', []);
    this.installmentVersions = this.safeReadFile<InstallmentVersion[]>('installment_versions_database.json', []);

    this.academicCalendars = this.safeReadFile<AcademicCalendar[]>('academic_calendars_database.json', []);
    this.academicTerms = this.safeReadFile<AcademicTerm[]>('academic_terms_database.json', []);
    this.academicPeriods = this.safeReadFile<AcademicPeriod[]>('academic_periods_database.json', []);
    /*
      { id: 'acad_per_2026_09', calendarId: 'acad_cal_2026', name: '2026-09', startDate: '2026-09-01', endDate: '2026-09-30', isActive: true, isClosed: false },
      { id: 'acad_per_2026_10', calendarId: 'acad_cal_2026', name: '2026-10', startDate: '2026-10-01', endDate: '2026-10-31', isActive: true, isClosed: false },
      { id: 'acad_per_2026_11', calendarId: 'acad_cal_2026', name: '2026-11', startDate: '2026-11-01', endDate: '2026-11-30', isActive: true, isClosed: false },
      { id: 'acad_per_2026_12', calendarId: 'acad_cal_2026', name: '2026-12', startDate: '2026-12-01', endDate: '2026-12-31', isActive: true, isClosed: false },
      { id: 'acad_per_2027_01', calendarId: 'acad_cal_2026', name: '2027-01', startDate: '2027-01-01', endDate: '2027-01-31', isActive: true, isClosed: false },
      { id: 'acad_per_2027_02', calendarId: 'acad_cal_2026', name: '2027-02', startDate: '2027-02-01', endDate: '2027-02-28', isActive: true, isClosed: false },
      { id: 'acad_per_2027_03', calendarId: 'acad_cal_2026', name: '2027-03', startDate: '2027-03-01', endDate: '2027-03-31', isActive: true, isClosed: false },
      { id: 'acad_per_2027_04', calendarId: 'acad_cal_2026', name: '2027-04', startDate: '2027-04-01', endDate: '2027-04-30', isActive: true, isClosed: false },
      { id: 'acad_per_2027_05', calendarId: 'acad_cal_2026', name: '2027-05', startDate: '2027-05-01', endDate: '2027-05-31', isActive: true, isClosed: false },
      { id: 'acad_per_2027_06', calendarId: 'acad_cal_2026', name: '2027-06', startDate: '2027-06-01', endDate: '2027-06-30', isActive: true, isClosed: false }
    ]); */
    this.recognitionPolicies = this.safeReadFile<RevenueRecognitionPolicy[]>('recognition_policies_database.json', []);
    this.recognitionSchedules = this.safeReadFile<RevenueRecognitionSchedule[]>('recognition_schedules_database.json', []);
    this.recognitionEntries = this.safeReadFile<RevenueRecognitionEntry[]>('recognition_entries_database.json', []);
    this.recognitionHistories = this.safeReadFile<RevenueRecognitionHistory[]>('recognition_histories_database.json', []);
    this.recognitionAdjustments = this.safeReadFile<RevenueRecognitionAdjustment[]>('recognition_adjustments_database.json', []);
    this.financialConfigurations = this.safeReadFile<FinancialConfiguration[]>('financial_configurations_database.json', []);
    this.financialConfigurationAuditLogs = this.safeReadFile<FinancialConfigurationAuditLog[]>('financial_configuration_audit_logs_database.json', []);

    this.receivableAccounts = this.safeReadFile<ReceivableAccount[]>('receivable_accounts_database.json', []);
    this.receivableTransactions = this.safeReadFile<ReceivableTransaction[]>('receivable_transactions_database.json', []);
    this.receivableBalances = this.safeReadFile<ReceivableBalance[]>('receivable_balances_database.json', []);
    this.receivableAllocations = this.safeReadFile<ReceivableAllocation[]>('receivable_allocations_database.json', []);
    this.receivableSettlements = this.safeReadFile<ReceivableSettlement[]>('receivable_settlements_database.json', []);
    this.receivableAdjustments = this.safeReadFile<ReceivableAdjustment[]>('receivable_adjustments_database.json', []);
    this.receivableWriteOffs = this.safeReadFile<ReceivableWriteOff[]>('receivable_write_offs_database.json', []);
    this.receivableStatusHistories = this.safeReadFile<ReceivableStatusHistory[]>('receivable_status_histories_database.json', []);
    this.receivableAudits = this.safeReadFile<ReceivableAudit[]>('receivable_audits_database.json', []);
    this.collectionCases = this.safeReadFile<CollectionCase[]>('collection_cases_database.json', []);
    this.collectionPromises = this.safeReadFile<CollectionPromise[]>('collection_promises_database.json', []);
    this.collectionReceipts = this.safeReadFile<CollectionReceipt[]>('collection_receipts_database.json', []);
    this.collectionAllocations = this.safeReadFile<CollectionAllocation[]>('collection_allocations_database.json', []);

    this.treasuryAccounts = this.safeReadFile<TreasuryAccount[]>('treasury_accounts_database.json', []);
    this.treasuryTransactions = this.safeReadFile<TreasuryTransaction[]>('treasury_transactions_database.json', []);
    this.treasuryTransfers = this.safeReadFile<TreasuryTransfer[]>('treasury_transfers_database.json', []);
    this.paymentInstrumentConfigs = this.safeReadFile<PaymentInstrumentConfig[]>('payment_instruments_database.json', []);

    this.mdmRegistry = this.safeReadFile<any[]>('mdm_registry_database.json', []);
    this.logs = this.safeReadFile<any[]>('logs_database.json', []);
    this.notifications = this.safeReadFile<any[]>('notifications_database.json', []);
    this.reportDefinitions = this.safeReadFile<any[]>('report_definitions_database.json', []);
    this.systemGLMappings = this.safeReadFile<any[]>('system_gl_mappings_database.json', []);
    this.templateAccounts = this.safeReadFile<any[]>('template_accounts_database.json', []);
    this.tenants = this.safeReadFile<any[]>('tenants_database.json', []);
    this.users = this.safeReadFile<any[]>('users_database.json', []);
    this.workflowDefinitions = this.safeReadFile<any[]>('workflow_definitions_database.json', []);
    this.workflowInstances = this.safeReadFile<any[]>('workflow_instances_database.json', []);

    this.kpiDefinitions = this.safeReadFile<KPIDefinition[]>('kpi_definitions_database.json', []);
    this.dashboardDefinitions = this.safeReadFile<DashboardDefinition[]>('dashboard_definitions_database.json', []);

    this.backgroundJobs = this.safeReadFile<any[]>('background_jobs_database.json', []);
    this.backupDefinitions = this.safeReadFile<any[]>('backup_definitions_database.json', []);
    this.coaTemplates = this.safeReadFile<any[]>('coa_templates_database.json', []);
    this.dmsDocuments = this.safeReadFile<any[]>('dms_documents_database.json', []);
    this.apiConfigurations = this.safeReadFile<any[]>('api_configurations_database.json', []);

    this.aiModels = this.safeReadFile<any[]>('ai_models_database.json', []);
    this.promptTemplates = this.safeReadFile<any[]>('prompt_templates_database.json', []);

    this.initialized = true;
  }

  // --- HEALTH CHECK UTILITIES ---

  /**
   * Performs an active probe on the Supabase service to verify actual connection.
   */
  public static async checkConnection(): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      this.cachedHealth = false;
      return false;
    }

    try {
      const queryPromise = supabase.from('schools').select('id').limit(1);
      const timeoutPromise = new Promise<{ error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 2000)
      );

      const result = await Promise.race([queryPromise, timeoutPromise]);
      if (result && (result as any).error) {
        this.cachedHealth = false;
        return false;
      }
      this.cachedHealth = true;
      return true;
    } catch (err: any) {
      this.cachedHealth = false;
      return false;
    }
  }

  /**
   * Retrieves connection health, using a cached status for 5 seconds to reduce network overhead.
   */
  public static async isHealthy(): Promise<boolean> {
    const now = Date.now();
    if (this.cachedHealth !== null && (now - this.lastHealthCheckTime < 5000)) {
      return this.cachedHealth;
    }
    this.lastHealthCheckTime = now;
    return this.checkConnection();
  }

  // --- EMERGENCY QUEUE PERSISTENCE ---

  public static getQueue(): QueueItem[] {
    return this.safeReadFile<QueueItem[]>('emergency_queue.json', []);
  }

  public static saveQueue(queue: QueueItem[]) {
    this.safeWriteFile('emergency_queue.json', queue);
  }

  public static async enqueueWrite(item: QueueItem): Promise<void> {
    const queue = this.getQueue();
    // Add item to queue to preserve order
    queue.push(item);
    this.saveQueue(queue);
    EnterpriseLogger.info(`💾 [FallbackStorage Proxy]: Enqueued operation ${item.operation} for '${item.table}' (id: ${item.recordId}).`, "FallbackStorage");
  }

  // --- EMERGENCY SYNCHRONIZATION AND CONFLICT RESOLUTION ---

  public static async syncQueue(): Promise<void> {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    EnterpriseLogger.info(`🔄 [FallbackStorage Proxy]: Syncing ${queue.length} queued emergency operations to Supabase...`, "FallbackStorage");

    const supabase = getSupabaseClient();
    if (!supabase) {
      EnterpriseLogger.warn("⚠️ [FallbackStorage Proxy]: Cannot sync, Supabase client is not available.", "FallbackStorage");
      return;
    }

    const remainingQueue: QueueItem[] = [];

    for (const item of queue) {
      try {
        EnterpriseLogger.info(`⏳ [FallbackStorage Proxy]: Syncing item ${item.id} (${item.operation} on '${item.table}' for record '${item.recordId}')...`, "FallbackStorage");
        
        // 1. Conflict checking
        const pkField = item.table === 'exams_database' ? 'school_id' : 'id';
        const { data: existingRecord, error: fetchError } = await supabase
          .from(item.table)
          .select('*')
          .eq(pkField, item.recordId)
          .maybeSingle();

        if (fetchError) {
          EnterpriseLogger.error(`Error checking conflict for queued item ${item.id}:`, "FallbackStorage", { error: fetchError.message });
          remainingQueue.push(item);
          continue;
        }

        let finalDataToSave = item.data;
        let conflictDetails = '';

        if (existingRecord) {
          EnterpriseLogger.info(`⚠️ [FallbackStorage Proxy]: Conflict detected for record ${item.recordId} in table '${item.table}'.`, "FallbackStorage");
          
          if (item.operation === 'INSERT') {
            // Convert INSERT to UPSERT/merge
            if (item.table === 'exams_database') {
              finalDataToSave = item.data; // For exams_database, it's a single config document, overwriting is correct
            } else {
              finalDataToSave = { ...existingRecord, ...item.data };
            }
            conflictDetails = `تداخل إدخال: دمج السجل المنشأ محلياً مع الخادم لتجنب تكرار المفاتيح.`;
          } else if (item.operation === 'UPDATE') {
            // Apply updates on top of remote state
            if (item.table === 'exams_database') {
              finalDataToSave = item.data;
            } else {
              finalDataToSave = { ...existingRecord, ...item.data };
            }
            conflictDetails = `تداخل تحديث: دمج التعديلات الأخيرة مع السجل الحالي على الخادم.`;
          }
        }

        // 2. Database write
        if (item.operation === 'DELETE') {
          const { error: deleteError } = await supabase
            .from(item.table)
            .delete()
            .eq(pkField, item.recordId);
          
          if (deleteError) throw deleteError;
        } else {
          let payload = finalDataToSave;
          if (item.table === 'exams_database') {
            payload = {
              school_id: item.schoolId,
              data: finalDataToSave,
              updated_at: new Date().toISOString()
            };
          }
          const { error: upsertError } = await supabase
            .from(item.table)
            .upsert(payload, { onConflict: pkField });

          if (upsertError) throw upsertError;
        }

        // 3. Sync Audit logging
        const auditContext = item.auditContext || {
          userId: 'system-sync',
          userName: 'مزامنة الطوارئ',
          userRole: 'SuperAdmin',
          ipAddress: '127.0.0.1',
          details: `مزامنة عملية ${item.operation} لجدول ${item.table} بنجاح.`
        };

        const newLog = {
          id: `log_sync_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          schoolId: item.schoolId,
          timestamp: new Date().toISOString(),
          userId: auditContext.userId,
          userName: auditContext.userName,
          userRole: auditContext.userRole,
          action: item.operation,
          module: item.table,
          ipAddress: auditContext.ipAddress,
          details: `[مزامنة طوارئ تلقائية]: ${auditContext.details}. ${conflictDetails ? `[حل التعارض]: ${conflictDetails}` : ''}`
        };

        const { error: auditError } = await supabase
          .from('audit_logs')
          .insert([newLog]);

        if (auditError) {
          EnterpriseLogger.warn("⚠️ Failed to write synced audit log to Supabase:", "FallbackStorage", { details: auditError.message });
        }

        EnterpriseLogger.info(`✅ [FallbackStorage Proxy]: Queued item ${item.id} synchronized successfully.`, "FallbackStorage");

      } catch (err: any) {
        EnterpriseLogger.error(`❌ [FallbackStorage Proxy]: Failed to sync queued item ${item.id}:`, "FallbackStorage", { error: err.message || err });
        remainingQueue.push(item);
      }
    }

    // Save remaining queue (guarantees no data loss)
    this.saveQueue(remainingQueue);
  }

  // --- COMPREHENSIVE PROXY INTERFACE FOR REPOSITORIES ---

  /**
   * High-level wrapper for performing a resilient database write operation.
   * Performs Health Check, syncs queue first, and enqueues to Emergency Storage on outage.
   */
  public static async performWrite<T>(
    schoolId: string,
    table: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: any,
    supabaseWriteFn: () => Promise<T>,
    fallbackWriteFn: () => void,
    auditContext?: QueueItem['auditContext']
  ): Promise<T> {
    const isHealthy = await this.checkConnection();

    if (isHealthy) {
      try {
        // Sync any previous queue elements first to maintain chronological correctness
        await this.syncQueue();

        const result = await supabaseWriteFn();
        return result;
      } catch (err: any) {
        EnterpriseLogger.error(`❌ [FallbackStorage Proxy]: Direct write failed for table '${table}'.`, "FallbackStorage", { error: err });
        this.assertCanonicalPersistence(`write ${operation} ${table}/${recordId}`);
      }
    }

    this.assertCanonicalPersistence(`write ${operation} ${table}/${recordId}`);

    // Emergency storage fallback
    EnterpriseLogger.warn(`🚨 [FallbackStorage Emergency]: Supabase is unreachable. Saving operation to Emergency Queue & Storage for table '${table}'.`, "FallbackStorage");
    
    // Execute fallback locally to preserve Read-Your-Own-Writes consistency
    fallbackWriteFn();

    // Persist to Emergency Queue (prevents loss)
    await this.enqueueWrite({
      id: `q_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      operation,
      table,
      recordId,
      data,
      schoolId,
      auditContext
    });

    return data as T;
  }

  /**
   * Resilient read proxy. Ensures no local fallback is used when connection is active.
   */
  public static async performRead<T>(
    schoolId: string,
    table: string,
    supabaseReadFn: () => Promise<T[]>,
    fallbackReadFn: () => T[]
  ): Promise<T[]> {
    const isHealthy = await this.isHealthy();
    if (isHealthy) {
      try {
        return await supabaseReadFn();
      } catch (err: any) {
        EnterpriseLogger.error(`❌ [FallbackStorage Proxy]: Direct read failed for table '${table}'.`, "FallbackStorage", { error: err });
        this.assertCanonicalPersistence(`read ${table}`);
      }
    }

    this.assertCanonicalPersistence(`read ${table}`);

    EnterpriseLogger.warn(`🚨 [FallbackStorage Emergency]: Reading from local offline cache for table '${table}'.`, "FallbackStorage");
    return fallbackReadFn();
  }

  // --- GETTERS & SETTERS WITH SAVE TRIGGER & GUARDIANS ---
  // If database is active, these trigger console warnings when used directly

  private static guardEmergency(methodName: string) {
    if (this.cachedHealth === true) {
      EnterpriseLogger.warn(`⚠️ [FallbackStorage WARNING]: ${methodName} was called directly despite a healthy Supabase connection. Direct fallback storage usage is discouraged.`, "FallbackStorage");
    }
  }

  public static getStudents() { this.initialize(); this.guardEmergency('getStudents'); return this.students; }
  public static saveStudents(data: Student[]) {
    this.students = data;
    this.safeWriteFile('students_database.json', data);
  }

  public static getInvoices() { this.initialize(); this.guardEmergency('getInvoices'); return this.invoices; }
  public static saveInvoices(data: Invoice[]) {
    this.invoices = data;
    this.safeWriteFile('invoices_database.json', data);
  }

  public static getExams() { this.initialize(); this.guardEmergency('getExams'); return this.exams; }
  public static saveExams(data: any) {
    this.exams = data;
    this.safeWriteFile('exams_database.json', data);
  }

  public static getTeachers() { this.initialize(); this.guardEmergency('getTeachers'); return this.teachers; }
  public static saveTeachers(data: Teacher[]) {
    this.teachers = data;
    this.safeWriteFile('teachers_database.json', data);
  }

  public static getEmployees() { this.initialize(); this.guardEmergency('getEmployees'); return this.employees; }
  public static saveEmployees(data: Employee[]) {
    this.employees = data;
    this.safeWriteFile('employees_database.json', data);
  }

  public static getInventory() { this.initialize(); this.guardEmergency('getInventory'); return this.inventory; }
  public static saveInventory(data: InventoryItem[]) {
    this.inventory = data;
    this.safeWriteFile('inventory_database.json', data);
  }

  public static getBuses() { this.initialize(); this.guardEmergency('getBuses'); return this.buses; }
  public static saveBuses(data: BusRoute[]) {
    this.buses = data;
    this.safeWriteFile('buses_database.json', data);
  }

  public static getAuditLogs() { this.initialize(); this.guardEmergency('getAuditLogs'); return this.auditLogs; }
  public static saveAuditLogs(data: AuditLog[]) {
    this.auditLogs = data;
    this.safeWriteFile('auditlogs_database.json', data);
  }

  public static getAttendance() { this.initialize(); this.guardEmergency('getAttendance'); return this.attendance; }
  public static saveAttendance(data: Attendance[]) {
    this.attendance = data;
    this.safeWriteFile('attendance_database.json', data);
  }

  public static getUniforms() { this.initialize(); this.guardEmergency('getUniforms'); return this.uniforms; }
  public static saveUniforms(data: any[]) {
    this.uniforms = data;
    this.safeWriteFile('uniforms_database.json', data);
  }

  public static getLibrary() { this.initialize(); this.guardEmergency('getLibrary'); return this.library; }
  public static saveLibrary(data: any[]) {
    this.library = data;
    this.safeWriteFile('library_database.json', data);
  }

  public static getGuardians() { this.initialize(); this.guardEmergency('getGuardians'); return this.guardians; }
  public static saveGuardians(data: any[]) {
    this.guardians = data;
    this.safeWriteFile('guardians_database.json', data);
  }

  public static getStudentGuardians() { this.initialize(); this.guardEmergency('getStudentGuardians'); return this.student_guardians; }
  public static saveStudentGuardians(data: any[]) {
    this.student_guardians = data;
    this.safeWriteFile('student_guardians_database.json', data);
  }

  public static getStudentMedicalRecords() { this.initialize(); this.guardEmergency('getStudentMedicalRecords'); return this.student_medical_records; }
  public static saveStudentMedicalRecords(data: any[]) {
    this.student_medical_records = data;
    this.safeWriteFile('student_medical_records_database.json', data);
  }

  public static getStudentTransportation() { this.initialize(); this.guardEmergency('getStudentTransportation'); return this.student_transportation; }
  public static saveStudentTransportation(data: any[]) {
    this.student_transportation = data;
    this.safeWriteFile('student_transportation_database.json', data);
  }

  public static getStudentLibraryAccounts() { this.initialize(); this.guardEmergency('getStudentLibraryAccounts'); return this.student_library_accounts; }
  public static saveStudentLibraryAccounts(data: any[]) {
    this.student_library_accounts = data;
    this.safeWriteFile('student_library_accounts_database.json', data);
  }

  public static getStudentUniformAccounts() { this.initialize(); this.guardEmergency('getStudentUniformAccounts'); return this.student_uniform_accounts; }
  public static saveStudentUniformAccounts(data: any[]) {
    this.student_uniform_accounts = data;
    this.safeWriteFile('student_uniform_accounts_database.json', data);
  }

  public static getStudentAssets() { this.initialize(); this.guardEmergency('getStudentAssets'); return this.student_assets; }
  public static saveStudentAssets(data: any[]) {
    this.student_assets = data;
    this.safeWriteFile('student_assets_database.json', data);
  }

  public static getStudentDocuments() { this.initialize(); this.guardEmergency('getStudentDocuments'); return this.student_documents; }
  public static saveStudentDocuments(data: any[]) {
    this.student_documents = data;
    this.safeWriteFile('student_documents_database.json', data);
  }

  public static getStudentContacts() { this.initialize(); this.guardEmergency('getStudentContacts'); return this.student_contacts; }
  public static saveStudentContacts(data: any[]) {
    this.student_contacts = data;
    this.safeWriteFile('student_contacts_database.json', data);
  }

  public static getJournalEntries() { this.initialize(); this.guardEmergency('getJournalEntries'); return this.journalEntries; }
  public static saveJournalEntries(data: JournalEntry[]) {
    this.journalEntries = data;
    this.safeWriteFile('journal_entries_database.json', data);
  }

  public static getVouchers() { this.initialize(); this.guardEmergency('getVouchers'); return this.vouchers; }
  public static saveVouchers(data: Voucher[]) {
    this.vouchers = data;
    this.safeWriteFile('vouchers_database.json', data);
  }

  public static getAccounts() { this.initialize(); this.guardEmergency('getAccounts'); return this.accounts; }
  public static saveAccounts(data: Account[]) {
    this.accounts = data;
    this.safeWriteFile('accounts_database.json', data);
  }

  public static getFiscalYears() { this.initialize(); this.guardEmergency('getFiscalYears'); return this.fiscalYears; }
  public static saveFiscalYears(data: FiscalYear[]) {
    this.fiscalYears = data;
    this.safeWriteFile('fiscal_years_database.json', data);
  }

  public static getAccountingPeriods() { this.initialize(); this.guardEmergency('getAccountingPeriods'); return this.accountingPeriods; }
  public static saveAccountingPeriods(data: AccountingPeriod[]) {
    this.accountingPeriods = data;
    this.safeWriteFile('accounting_periods_database.json', data);
  }

  public static getGeneralLedgerLines() { this.initialize(); this.guardEmergency('getGeneralLedgerLines'); return this.generalLedgerLines; }
  public static saveGeneralLedgerLines(data: GeneralLedger[]) {
    this.generalLedgerLines = data;
    this.safeWriteFile('general_ledger_database.json', data);
  }

  public static getInstallmentPlans() { this.initialize(); return this.installmentPlans; }
  public static saveInstallmentPlans(data: InstallmentPlan[]) {
    this.installmentPlans = data;
    this.safeWriteFile('installment_plans_database.json', data);
  }

  public static getInstallmentSchedules() { this.initialize(); return this.installmentSchedules; }
  public static saveInstallmentSchedules(data: InstallmentSchedule[]) {
    this.installmentSchedules = data;
    this.safeWriteFile('installment_schedules_database.json', data);
  }

  public static getInstallmentItems() { this.initialize(); return this.installmentItems; }
  public static saveInstallmentItems(data: InstallmentItem[]) {
    this.installmentItems = data;
    this.safeWriteFile('installment_items_database.json', data);
  }

  public static getInstallmentPayments() { this.initialize(); return this.installmentPayments; }
  public static saveInstallmentPayments(data: InstallmentPayment[]) {
    this.installmentPayments = data;
    this.safeWriteFile('installment_payments_database.json', data);
  }

  public static getInstallmentHistories() { this.initialize(); return this.installmentHistories; }
  public static saveInstallmentHistories(data: InstallmentHistory[]) {
    this.installmentHistories = data;
    this.safeWriteFile('installment_histories_database.json', data);
  }

  public static getInstallmentVersions() { this.initialize(); return this.installmentVersions; }
  public static saveInstallmentVersions(data: InstallmentVersion[]) {
    this.installmentVersions = data;
    this.safeWriteFile('installment_versions_database.json', data);
  }

  public static getAcademicCalendars() { this.initialize(); return this.academicCalendars; }
  public static saveAcademicCalendars(data: AcademicCalendar[]) {
    this.academicCalendars = data;
    this.safeWriteFile('academic_calendars_database.json', data);
  }

  public static getAcademicTerms() { this.initialize(); return this.academicTerms; }
  public static saveAcademicTerms(data: AcademicTerm[]) {
    this.academicTerms = data;
    this.safeWriteFile('academic_terms_database.json', data);
  }

  public static getAcademicPeriods() { this.initialize(); return this.academicPeriods; }
  public static saveAcademicPeriods(data: AcademicPeriod[]) {
    this.academicPeriods = data;
    this.safeWriteFile('academic_periods_database.json', data);
  }

  public static getRecognitionPolicies() { this.initialize(); return this.recognitionPolicies; }
  public static saveRecognitionPolicies(data: RevenueRecognitionPolicy[]) {
    this.recognitionPolicies = data;
    this.safeWriteFile('recognition_policies_database.json', data);
  }

  public static getRecognitionSchedules() { this.initialize(); return this.recognitionSchedules; }
  public static saveRecognitionSchedules(data: RevenueRecognitionSchedule[]) {
    this.recognitionSchedules = data;
    this.safeWriteFile('recognition_schedules_database.json', data);
  }

  public static getRecognitionEntries() { this.initialize(); return this.recognitionEntries; }
  public static saveRecognitionEntries(data: RevenueRecognitionEntry[]) {
    this.recognitionEntries = data;
    this.safeWriteFile('recognition_entries_database.json', data);
  }

  public static getRecognitionHistories() { this.initialize(); return this.recognitionHistories; }
  public static saveRecognitionHistories(data: RevenueRecognitionHistory[]) {
    this.recognitionHistories = data;
    this.safeWriteFile('recognition_histories_database.json', data);
  }

  public static getRecognitionAdjustments() { this.initialize(); return this.recognitionAdjustments; }
  public static saveRecognitionAdjustments(data: RevenueRecognitionAdjustment[]) {
    this.recognitionAdjustments = data;
    this.safeWriteFile('recognition_adjustments_database.json', data);
  }

  public static getFinancialConfigurations() { this.initialize(); return this.financialConfigurations; }
  public static saveFinancialConfigurations(data: FinancialConfiguration[]) {
    this.financialConfigurations = data;
    this.safeWriteFile('financial_configurations_database.json', data);
  }

  public static getFinancialConfigurationAuditLogs() { this.initialize(); return this.financialConfigurationAuditLogs; }
  public static saveFinancialConfigurationAuditLogs(data: FinancialConfigurationAuditLog[]) {
    this.financialConfigurationAuditLogs = data;
    this.safeWriteFile('financial_configuration_audit_logs_database.json', data);
  }

  public static getReceivableAccounts() { this.initialize(); return this.receivableAccounts; }
  public static saveReceivableAccounts(data: ReceivableAccount[]) {
    this.receivableAccounts = data;
    this.safeWriteFile('receivable_accounts_database.json', data);
  }

  public static getReceivableTransactions() { this.initialize(); return this.receivableTransactions; }
  public static saveReceivableTransactions(data: ReceivableTransaction[]) {
    this.receivableTransactions = data;
    this.safeWriteFile('receivable_transactions_database.json', data);
  }

  public static getReceivableBalances() { this.initialize(); return this.receivableBalances; }
  public static saveReceivableBalances(data: ReceivableBalance[]) {
    this.receivableBalances = data;
    this.safeWriteFile('receivable_balances_database.json', data);
  }

  public static getReceivableAllocations() { this.initialize(); return this.receivableAllocations; }
  public static saveReceivableAllocations(data: ReceivableAllocation[]) {
    this.receivableAllocations = data;
    this.safeWriteFile('receivable_allocations_database.json', data);
  }

  public static getReceivableSettlements() { this.initialize(); return this.receivableSettlements; }
  public static saveReceivableSettlements(data: ReceivableSettlement[]) {
    this.receivableSettlements = data;
    this.safeWriteFile('receivable_settlements_database.json', data);
  }

  public static getReceivableAdjustments() { this.initialize(); return this.receivableAdjustments; }
  public static saveReceivableAdjustments(data: ReceivableAdjustment[]) {
    this.receivableAdjustments = data;
    this.safeWriteFile('receivable_adjustments_database.json', data);
  }

  public static getReceivableWriteOffs() { this.initialize(); return this.receivableWriteOffs; }
  public static saveReceivableWriteOffs(data: ReceivableWriteOff[]) {
    this.receivableWriteOffs = data;
    this.safeWriteFile('receivable_write_offs_database.json', data);
  }

  public static getReceivableStatusHistories() { this.initialize(); return this.receivableStatusHistories; }
  public static saveReceivableStatusHistories(data: ReceivableStatusHistory[]) {
    this.receivableStatusHistories = data;
    this.safeWriteFile('receivable_status_histories_database.json', data);
  }

  public static getReceivableAudits() { this.initialize(); return this.receivableAudits; }
  public static saveReceivableAudits(data: ReceivableAudit[]) {
    this.receivableAudits = data;
    this.safeWriteFile('receivable_audits_database.json', data);
  }

  public static getCollectionCases() { this.initialize(); return this.collectionCases; }
  public static saveCollectionCases(data: CollectionCase[]) {
    this.collectionCases = data;
    this.safeWriteFile('collection_cases_database.json', data);
  }

  public static getCollectionPromises() { this.initialize(); return this.collectionPromises; }
  public static saveCollectionPromises(data: CollectionPromise[]) {
    this.collectionPromises = data;
    this.safeWriteFile('collection_promises_database.json', data);
  }

  public static getCollectionReceipts() { this.initialize(); return this.collectionReceipts; }
  public static saveCollectionReceipts(data: CollectionReceipt[]) {
    this.collectionReceipts = data;
    this.safeWriteFile('collection_receipts_database.json', data);
  }

  public static getCollectionAllocations() { this.initialize(); return this.collectionAllocations; }
  public static saveCollectionAllocations(data: CollectionAllocation[]) {
    this.collectionAllocations = data;
    this.safeWriteFile('collection_allocations_database.json', data);
  }

  public static getTreasuryAccounts() { this.initialize(); return this.treasuryAccounts; }
  public static saveTreasuryAccounts(data: TreasuryAccount[]) {
    this.treasuryAccounts = data;
    this.safeWriteFile('treasury_accounts_database.json', data);
  }

  public static getTreasuryTransactions() { this.initialize(); return this.treasuryTransactions; }
  public static saveTreasuryTransactions(data: TreasuryTransaction[]) {
    this.treasuryTransactions = data;
    this.safeWriteFile('treasury_transactions_database.json', data);
  }

  public static getPaymentInstrumentConfigs() { this.initialize(); return this.paymentInstrumentConfigs; }
  public static savePaymentInstrumentConfigs(data: PaymentInstrumentConfig[]) {
    this.paymentInstrumentConfigs = data;
    this.safeWriteFile('payment_instruments_database.json', data);
  }

  public static getTreasuryTransfers() { this.initialize(); return this.treasuryTransfers; }
  public static saveTreasuryTransfers(data: TreasuryTransfer[]) {
    this.treasuryTransfers = data;
    this.safeWriteFile('treasury_transfers_database.json', data);
  }

  public static getMdmRegistry() { this.initialize(); return this.mdmRegistry; }
  public static saveMdmRegistry(data: any[]) {
    this.mdmRegistry = data;
    this.safeWriteFile('mdm_registry_database.json', data);
  }

  public static getLogs() { this.initialize(); return this.logs; }
  public static saveLogs(data: any[]) {
    this.logs = data;
    this.safeWriteFile('logs_database.json', data);
  }

  public static getNotifications() { this.initialize(); return this.notifications; }
  public static saveNotifications(data: any[]) {
    this.notifications = data;
    this.safeWriteFile('notifications_database.json', data);
  }

  public static getReportDefinitions() { this.initialize(); return this.reportDefinitions; }
  public static saveReportDefinitions(data: any[]) {
    this.reportDefinitions = data;
    this.safeWriteFile('report_definitions_database.json', data);
  }

  public static getSystemGLMappings() { this.initialize(); return this.systemGLMappings; }
  public static saveSystemGLMappings(data: any[]) {
    this.systemGLMappings = data;
    this.safeWriteFile('system_gl_mappings_database.json', data);
  }

  public static getTemplateAccounts() { this.initialize(); return this.templateAccounts; }
  public static saveTemplateAccounts(data: any[]) {
    this.templateAccounts = data;
    this.safeWriteFile('template_accounts_database.json', data);
  }

  public static getTenants() { this.initialize(); return this.tenants; }
  public static saveTenants(data: any[]) {
    this.tenants = data;
    this.safeWriteFile('tenants_database.json', data);
  }

  public static getUsers() { this.initialize(); return this.users; }
  public static saveUsers(data: any[]) {
    this.users = data;
    this.safeWriteFile('users_database.json', data);
  }

  public static getWorkflowDefinitions() { this.initialize(); return this.workflowDefinitions; }
  public static saveWorkflowDefinitions(data: any[]) {
    this.workflowDefinitions = data;
    this.safeWriteFile('workflow_definitions_database.json', data);
  }

  public static getWorkflowInstances() { this.initialize(); return this.workflowInstances; }
  public static saveWorkflowInstances(data: any[]) {
    this.workflowInstances = data;
    this.safeWriteFile('workflow_instances_database.json', data);
  }

  public static getKpiDefinitions() { this.initialize(); return this.kpiDefinitions; }
  public static saveKpiDefinitions(data: KPIDefinition[]) {
    this.kpiDefinitions = data;
    this.safeWriteFile('kpi_definitions_database.json', data);
  }

  public static getDashboardDefinitions() { this.initialize(); return this.dashboardDefinitions; }
  public static saveDashboardDefinitions(data: DashboardDefinition[]) {
    this.dashboardDefinitions = data;
    this.safeWriteFile('dashboard_definitions_database.json', data);
  }

  public static getBackgroundJobs() { this.initialize(); return this.backgroundJobs; }
  public static saveBackgroundJobs(data: any[]) {
    this.backgroundJobs = data;
    this.safeWriteFile('background_jobs_database.json', data);
  }

  public static getBackupDefinitions() { this.initialize(); return this.backupDefinitions; }
  public static saveBackupDefinitions(data: any[]) {
    this.backupDefinitions = data;
    this.safeWriteFile('backup_definitions_database.json', data);
  }

  public static getCOATemplates() { this.initialize(); return this.coaTemplates; }
  public static saveCOATemplates(data: any[]) {
    this.coaTemplates = data;
    this.safeWriteFile('coa_templates_database.json', data);
  }

  public static getDmsDocuments() { this.initialize(); return this.dmsDocuments; }
  public static saveDmsDocuments(data: any[]) {
    this.dmsDocuments = data;
    this.safeWriteFile('dms_documents_database.json', data);
  }

  public static getApiConfigurations() { this.initialize(); return this.apiConfigurations; }
  public static saveApiConfigurations(data: any[]) {
    this.apiConfigurations = data;
    this.safeWriteFile('api_configurations_database.json', data);
  }

  public static getAiModels() { this.initialize(); return this.aiModels; }
  public static saveAiModels(data: any[]) {
    this.aiModels = data;
    this.safeWriteFile('ai_models_database.json', data);
  }

  public static getPromptTemplates() { this.initialize(); return this.promptTemplates; }
  public static savePromptTemplates(data: any[]) {
    this.promptTemplates = data;
    this.safeWriteFile('prompt_templates_database.json', data);
  }
}
