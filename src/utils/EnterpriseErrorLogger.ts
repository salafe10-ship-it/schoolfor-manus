import { EnterpriseLogger } from '../database/services/EnterpriseLogger';

export interface SystemErrorLog {
  id: string;
  userName: string;
  screenName: string;
  operationName: string;
  errorTime: string;
  errorMessage: string;
  stackTrace: string;
  schoolId: string; // رقم المدرسة
  branchId: string; // رقم الفرع
}

export class EnterpriseErrorLogger {
  private static readonly STORAGE_KEY = 'erp_system_error_logs';
  private static listeners: (() => void)[] = [];

  // Seed default historical errors to show powerful search, filter and export on first load
  private static readonly HISTORICAL_SEEDS: SystemErrorLog[] = [
    {
      id: 'ERR-2026-001',
      userName: 'خالد الحربي (محاسب)',
      screenName: 'بوابة الشؤون المالية (StudentFinancialPortal)',
      operationName: 'ترحيل سند القبض للدفاتر العامة',
      errorTime: new Date(Date.now() - 3600000 * 2.5).toISOString(), // 2.5 hours ago
      errorMessage: 'FOREIGN KEY CONSTRAINT VIOLATION: Insert on table "journal_entries" violates foreign key constraint "fk_cost_center".',
      stackTrace: `Error: FK_VIOLATION\n    at SQLTransactionEngine.execute (transactionManager.ts:145:22)\n    at async StudentFinancialPortal.handleSaveReceipt (StudentFinancialPortal.tsx:556:11)`,
      schoolId: 'school_001',
      branchId: 'branch_riyadh_01'
    },
    {
      id: 'ERR-2026-002',
      userName: 'مريم العتيبي (معلمة)',
      screenName: 'شؤون الطلاب (StudentAffairsPortal)',
      operationName: 'حفظ سجل تسجيل الطالب الجديد',
      errorTime: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
      errorMessage: 'UNIQUE CONSTRAINT VIOLATION: Duplicate key value violates unique constraint "students_national_id_key" (ID: 1029384756).',
      stackTrace: `DatabaseError: duplicate key value violates unique constraint "students_national_id_key"\n    at FormLifecycleOrchestrator.run (FormLifecycleOrchestrator.ts:79:24)\n    at async StudentAffairsPortal.handleSaveStudent (StudentAffairsPortal.tsx:839:5)`,
      schoolId: 'school_001',
      branchId: 'branch_riyadh_01'
    },
    {
      id: 'ERR-2026-003',
      userName: 'سليمان غازي (مدير)',
      screenName: 'إدارة الزي المدرسي (SchoolUniformManagement)',
      operationName: 'تحديث مخزون المقاسات والتسليم الكلي',
      errorTime: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
      errorMessage: 'INSUFFICIENT_STOCK_ERROR: requested quantity (50) exceeds available uniform inventory in branch storage.',
      stackTrace: `Error: INSUFFICIENT_STOCK_ERROR\n    at SchoolUniformManagement.tsx:454:32\n    at async runInTransaction (UnitOfWork.ts:122:15)`,
      schoolId: 'school_002',
      branchId: 'branch_jeddah_02'
    },
    {
      id: 'ERR-2026-004',
      userName: 'نورة السديري (موظفة HR)',
      screenName: 'مسيرات الرواتب (PayrollTab)',
      operationName: 'اعتماد مسير الرواتب لشهر يوليو 2026',
      errorTime: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
      errorMessage: 'FISCAL_PERIOD_CLOSED_ERROR: Cannot post transaction. The current fiscal period for July 2026 is locked and closed.',
      stackTrace: `FiscalPeriodLockedException: July 2026 is closed\n    at PayrollTab.tsx:146:25\n    at async SQLTransactionEngine.run (transactionManager.ts:98:30)`,
      schoolId: 'school_001',
      branchId: 'branch_riyadh_01'
    },
    {
      id: 'ERR-2026-005',
      userName: 'أحمد اليوسف (أمين الصندوق)',
      screenName: 'منصة الخزينة والبنك (TreasuryPlatformPortal)',
      operationName: 'تسوية رصيد عهدة النقدية الفورية',
      errorTime: new Date(Date.now() - 3600000 * 36).toISOString(), // 1.5 days ago
      errorMessage: 'CASH_LIMIT_EXCEEDED: Transaction exceeds maximum allowed cash holding limit for safe tier BR-01.',
      stackTrace: `CashLimitExceededError: Limit is 50,000 SAR\n    at TreasuryPlatformPortal.tsx:737:12\n    at async Object.runInTransaction (UnitOfWork.ts:241:19)`,
      schoolId: 'school_003',
      branchId: 'branch_dammam_03'
    }
  ];

  public static initialize(): void {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.HISTORICAL_SEEDS));
    }

    // Capture global uncaught runtime exceptions automatically
    window.addEventListener('error', (event) => {
      this.log({
        userName: 'النظام التلقائي (System)',
        screenName: document.title || 'واجهة سحابية غير معروفة',
        operationName: 'معالجة الحدث البرمجي بالخلفية',
        errorMessage: event.message || 'خطأ غير معالج بالمتصفح',
        stackTrace: event.error?.stack || 'لا يتوفر Stack Trace',
        schoolId: 'school_001',
        branchId: 'branch_riyadh_01'
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      const errorMsg = event.reason instanceof Error ? event.reason.message : String(event.reason);
      const stack = event.reason instanceof Error ? event.reason.stack : undefined;
      this.log({
        userName: 'النظام التلقائي (Promises)',
        screenName: document.title || 'واجهة سحابية غير معروفة',
        operationName: 'عملية غير متزامنة (Async Promise)',
        errorMessage: `Unhandled Promise Rejection: ${errorMsg}`,
        stackTrace: stack || 'لا يتوفر Stack Trace',
        schoolId: 'school_001',
        branchId: 'branch_riyadh_01'
      });
    });
  }

  public static subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notify(): void {
    this.listeners.forEach(l => {
      try {
        l();
      } catch (e) {
        console.error('Error in EnterpriseErrorLogger listener:', e);
      }
    });
  }

  /**
   * Log an exception to the unified system-wide error log
   */
  public static log(params: Omit<SystemErrorLog, 'id' | 'errorTime'>): SystemErrorLog {
    const logs = this.getAllLogs();
    
    const newLog: SystemErrorLog = {
      id: `ERR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      errorTime: new Date().toISOString(),
      userName: params.userName || 'مستخدم غير معرف',
      screenName: params.screenName || 'شاشة غير معروفة',
      operationName: params.operationName || 'عملية غير معروفة',
      errorMessage: params.errorMessage || 'رسالة خطأ غير محددة',
      stackTrace: params.stackTrace || new Error().stack || 'لا يتوفر Stack Trace',
      schoolId: params.schoolId || 'N/A',
      branchId: params.branchId || 'N/A'
    };

    logs.unshift(newLog);
    
    // Cap log size at 200 items to preserve local storage
    if (logs.length > 200) {
      logs.pop();
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    
    // Also write to EnterpriseLogger
    EnterpriseLogger.error(
      `[Unified Error Log] ${newLog.errorMessage} (User: ${newLog.userName}, Screen: ${newLog.screenName})`,
      'EnterpriseErrorLogger',
      { ...newLog }
    );

    this.notify();
    return newLog;
  }

  /**
   * Retrieve all logged exceptions
   */
  public static getAllLogs(): SystemErrorLog[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) {
      return [...this.HISTORICAL_SEEDS];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...this.HISTORICAL_SEEDS];
    }
  }

  /**
   * Clear all error logs
   */
  public static clearAll(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    this.notify();
  }

  /**
   * Export logs to a printable / CSV safe representation
   */
  public static exportToCSV(logs: SystemErrorLog[]): string {
    const headers = [
      'ID',
      'اسم المستخدم',
      'اسم الشاشة',
      'اسم العملية',
      'وقت الخطأ',
      'رسالة الخطأ',
      'رقم المدرسة (Tenant ID)',
      'رقم الفرع'
    ];

    const rows = logs.map(log => [
      log.id,
      log.userName.replace(/"/g, '""'),
      log.screenName.replace(/"/g, '""'),
      log.operationName.replace(/"/g, '""'),
      log.errorTime,
      log.errorMessage.replace(/"/g, '""'),
      log.schoolId,
      log.branchId
    ]);

    const csvContent = [
      '\uFEFF' + headers.map(h => `"${h}"`).join(','), // Include UTF-8 BOM for Arabic characters
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }
}
