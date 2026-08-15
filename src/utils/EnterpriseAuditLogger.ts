import { EnterpriseLogger } from '../database/services/EnterpriseLogger';

export type AuditActionType = 
  | 'إضافة' 
  | 'تعديل' 
  | 'حذف' 
  | 'اعتماد' 
  | 'إلغاء اعتماد' 
  | 'طباعة' 
  | 'تصدير' 
  | 'تسجيل الدخول' 
  | 'تسجيل الخروج';

export interface EnterpriseAuditLog {
  id: string;
  action: AuditActionType;
  oldValue: string; // القيمة القديمة
  newValue: string; // القيمة الجديدة
  userName: string; // المستخدم
  userRole: string; // رتبة المستخدم
  device: string;   // الجهاز المتصل / متصفح العميل
  date: string;     // التاريخ (مثال: 2026-07-18)
  time: string;     // الوقت (مثال: 14:35:12)
  timestamp: string; // التوقيت الكلي للمطابقة
  module: string;    // المودول أو الشاشة (مثال: شؤون الطلاب، المحاسبة)
  ipAddress: string; // عنوان IP
}

export class EnterpriseAuditLogger {
  private static readonly STORAGE_KEY = 'erp_unified_audit_trail_v1';
  private static listeners: (() => void)[] = [];

  // Seed default audit history
  private static readonly SEED_LOGS: EnterpriseAuditLog[] = [
    {
      id: 'AUD-2026-001',
      action: 'إضافة',
      oldValue: 'لا يوجد (سجل جديد)',
      newValue: 'اسم الطالب: ياسر عبد الرحمن العتيبي، الهوية الوطنية: 1098473859، الصف: الأول الثانوي، القسط السنوي: 15,000 ريال',
      userName: 'أ. سارة القحطاني (مديرة القبول)',
      userRole: 'مسؤول القبول والتسجيل',
      device: 'Chrome v122 / Windows 11',
      date: '2026-07-18',
      time: '09:12:44',
      timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(),
      module: 'شؤون الطلاب (Student Registry)',
      ipAddress: '192.168.1.44'
    },
    {
      id: 'AUD-2026-002',
      action: 'تعديل',
      oldValue: 'الحالة: مسودة، القيمة الكلية: 12,000 ريال، الخصم: 5%',
      newValue: 'الحالة: مرحلة، القيمة الكلية: 11,400 ريال، الخصم: 10% (بموجب موافقة المدير التنفيذي)',
      userName: 'أ. أحمد اليوسف (محاسب)',
      userRole: 'أخصائي حسابات عملاء',
      device: 'Firefox v123 / macOS Sonoma',
      date: '2026-07-18',
      time: '08:45:10',
      timestamp: new Date(Date.now() - 3600000 * 1.2).toISOString(),
      module: 'بوابة الشؤون المالية (StudentFinancialPortal)',
      ipAddress: '192.168.12.80'
    },
    {
      id: 'AUD-2026-003',
      action: 'اعتماد',
      oldValue: 'حالة مسير رواتب الموظفين لشهر يونيو 2026: مسودة غير معتمدة (قيد المراجعة والتدقيق)',
      newValue: 'حالة مسير رواتب الموظفين لشهر يونيو 2026: معتمد بالكامل ومحول للصرف الفوري لبنك الراجحي بنجاح',
      userName: 'سليمان غازي (المدير المالي)',
      userRole: 'رئيس الشؤون المالية والـ HR',
      device: 'Safari v17 / iPadOS',
      date: '2026-07-17',
      time: '18:20:15',
      timestamp: new Date(Date.now() - 3600000 * 14).toISOString(),
      module: 'مسيرات الرواتب والـ HR (Payroll Management)',
      ipAddress: '192.168.30.22'
    },
    {
      id: 'AUD-2026-004',
      action: 'إلغاء اعتماد',
      oldValue: 'فاتورة الرسوم الدراسية رقم (INV-2026-904): معتمدة ومرحلة للدفاتر العامة',
      newValue: 'فاتورة الرسوم الدراسية رقم (INV-2026-904): ملغاة الاعتماد وتحت حالة "تعديل المراجعة" بسبب خطأ في تصنيف سكن الطالب',
      userName: 'سليمان غازي (المدير المالي)',
      userRole: 'رئيس الشؤون المالية والـ HR',
      device: 'Safari v17 / macOS',
      date: '2026-07-17',
      time: '16:05:30',
      timestamp: new Date(Date.now() - 3600000 * 16).toISOString(),
      module: 'بوابة الشؤون المالية (StudentFinancialPortal)',
      ipAddress: '192.168.30.22'
    },
    {
      id: 'AUD-2026-005',
      action: 'حذف',
      oldValue: 'اسم المادة: "الذكاء الاصطناعي التطبيقي"، الرمز: AI-101، المعلم: د. يوسف الغامدي، عدد الساعات: 3 ساعات معتمدة',
      newValue: 'تم إتلاف وحذف المادة التدريسية نهائياً من قاعدة البيانات (انقضاء الخطة الدراسية الاستثنائية)',
      userName: 'د. خالد الحربي (وكيل الشؤون التعليمية)',
      userRole: 'وكيل الشؤون التعليمية والمناهج',
      device: 'Edge v121 / Windows 11',
      date: '2026-07-17',
      time: '11:30:12',
      timestamp: new Date(Date.now() - 3600000 * 21).toISOString(),
      module: 'إدارة المناهج والخطط (Curriculum Control)',
      ipAddress: '192.168.15.5'
    },
    {
      id: 'AUD-2026-006',
      action: 'تسجيل الدخول',
      oldValue: 'حالة الجلسة: غير متصل',
      newValue: 'حالة الجلسة: متصل (جلسة نشطة جديدة، توكن OAuth تم التحقق منه)',
      userName: 'أ. مريم العتيبي (معلمة)',
      userRole: 'معلم أول لغة عربية',
      device: 'Chrome Mobile v122 / Android 14',
      date: '2026-07-17',
      time: '07:50:00',
      timestamp: new Date(Date.now() - 3600000 * 25).toISOString(),
      module: 'شاشة تسجيل الدخول الموحد (SSO Auth)',
      ipAddress: '176.44.201.12'
    },
    {
      id: 'AUD-2026-007',
      action: 'تصدير',
      oldValue: 'عرض قائمة فواتير الطلاب على الشاشة (عدد الفواتير: 1240 فاتورة)',
      newValue: 'تصدير وتحميل تقرير الإيرادات والرسوم لجميع المدارس بصيغة Excel لرفعها لمجلس الإدارة الأعلى للمجموعة',
      userName: 'أ. أحمد اليوسف (محاسب)',
      userRole: 'أخصائي حسابات عملاء',
      device: 'Firefox v123 / macOS Sonoma',
      date: '2026-07-16',
      time: '15:10:45',
      timestamp: new Date(Date.now() - 3600000 * 42).toISOString(),
      module: 'التقارير والمطابقات المالية (Financial Reports)',
      ipAddress: '192.168.12.80'
    },
    {
      id: 'AUD-2026-008',
      action: 'طباعة',
      oldValue: 'عرض سجل الغياب والتاخر اليومي للطالب: عبد الرحمن بن مساعد',
      newValue: 'طباعة كشف غياب رسمي مختوم موجّه إلى ولي الأمر بسبب استنفاد نسبة 10% من ساعات التغيب غير المبررة',
      userName: 'أ. نورة السديري (موظفة HR)',
      userRole: 'مشرف غياب وانضباط الطلاب',
      device: 'Chrome v122 / Windows 10',
      date: '2026-07-16',
      time: '10:04:12',
      timestamp: new Date(Date.now() - 3600000 * 47).toISOString(),
      module: 'الحضور والانضباط السلوكي (Attendance Portal)',
      ipAddress: '192.168.44.11'
    },
    {
      id: 'AUD-2026-009',
      action: 'تسجيل الخروج',
      oldValue: 'حالة الجلسة: متصل بنشاط مستمر',
      newValue: 'حالة الجلسة: غير متصل (تم إنهاء جلسة العمل الآمنة بنجاح، تدمير توكن الاعتماد بالمتصفح والـ Cookies)',
      userName: 'د. خالد الحربي (وكيل الشؤون التعليمية)',
      userRole: 'وكيل الشؤون التعليمية والمناهج',
      device: 'Edge v121 / Windows 11',
      date: '2026-07-15',
      time: '17:40:00',
      timestamp: new Date(Date.now() - 3600000 * 62).toISOString(),
      module: 'شاشة تسجيل الدخول الموحد (SSO Auth)',
      ipAddress: '192.168.15.5'
    }
  ];

  /**
   * Initializes the audit trail with seed data if none exists
   */
  public static initialize(): void {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.SEED_LOGS));
    }
  }

  /**
   * Subscribe to real-time changes to update dashboards on the fly
   */
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
        console.error('Error in EnterpriseAuditLogger listener:', e);
      }
    });
  }

  /**
   * Logs a new event to the Audit Trail.
   */
  public static log(
    paramsOrAction: {
      action: AuditActionType;
      oldValue: any;
      newValue: any;
      userName: string;
      userRole?: string;
      device?: string;
      module?: string;
      ipAddress?: string;
    } | string,
    moduleOrCategory?: string,
    newValueOrResourceId?: any,
    userNameOrUserId?: string,
    messageOrNotes?: string
  ): EnterpriseAuditLog {
    if (typeof paramsOrAction === 'string') {
      const actionStr = paramsOrAction;
      const moduleStr = moduleOrCategory || 'الوحدة الأساسية';
      const resourceIdStr = newValueOrResourceId || '';
      const userIdStr = userNameOrUserId || 'مستخدم مجهول';
      const notesStr = messageOrNotes || '';

      let mappedAction: AuditActionType = 'إضافة';
      if (actionStr === 'CREATE') mappedAction = 'إضافة';
      else if (actionStr === 'UPDATE') mappedAction = 'تعديل';
      else if (actionStr === 'DELETE') mappedAction = 'حذف';
      else if (actionStr === 'APPROVE') mappedAction = 'اعتماد';
      else if (actionStr === 'CANCEL') mappedAction = 'إلغاء اعتماد';

      return this.log({
        action: mappedAction,
        oldValue: 'لا يوجد (مستند)',
        newValue: `المعرف: ${resourceIdStr} | ${notesStr}`,
        userName: userIdStr,
        module: moduleStr
      });
    }

    const params = paramsOrAction;
    const logs = this.getAllLogs();
    
    // Auto-detect device and user-agent if client-side
    let detectedDevice = params.device;
    if (!detectedDevice && typeof window !== 'undefined' && window.navigator) {
      const ua = navigator.userAgent;
      if (ua.includes('Chrome')) detectedDevice = 'Chrome / ' + (ua.includes('Windows') ? 'Windows' : 'macOS');
      else if (ua.includes('Safari')) detectedDevice = 'Safari / macOS';
      else if (ua.includes('Firefox')) detectedDevice = 'Firefox';
      else detectedDevice = 'متصفح ويب غير محدد';
    }
    if (!detectedDevice) detectedDevice = 'جهاز العميل الافتراضي';

    const now = new Date();
    
    // Format Date: YYYY-MM-DD
    const dateStr = now.toISOString().split('T')[0];
    
    // Format Time: HH:MM:SS
    const timeStr = now.toTimeString().split(' ')[0];

    const newLog: EnterpriseAuditLog = {
      id: `AUD-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      action: params.action,
      oldValue: typeof params.oldValue === 'object' ? JSON.stringify(params.oldValue) : String(params.oldValue),
      newValue: typeof params.newValue === 'object' ? JSON.stringify(params.newValue) : String(params.newValue),
      userName: params.userName || 'مستخدم مجهول',
      userRole: params.userRole || 'موظف النظام',
      device: detectedDevice,
      date: dateStr,
      time: timeStr,
      timestamp: now.toISOString(),
      module: params.module || 'الوحدة الأساسية لنظام المدارس',
      ipAddress: params.ipAddress || '127.0.0.1'
    };

    logs.unshift(newLog);

    // Keep memory clean
    if (logs.length > 500) {
      logs.pop();
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));

    // Also write to secondary enterprise logger for central diagnostic logs
    EnterpriseLogger.info(
      `[UNIFIED AUDIT TRAIL] Action: ${newLog.action}, User: ${newLog.userName}, Module: ${newLog.module}`,
      'EnterpriseAuditLogger',
      { ...newLog }
    );

    this.notify();
    return newLog;
  }

  /**
   * Retrieves all audit logs from the persistence layer
   */
  public static getAllLogs(): EnterpriseAuditLog[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) {
      return [...this.SEED_LOGS];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...this.SEED_LOGS];
    }
  }

  /**
   * Clear all audit logs (Highly audited event itself!)
   */
  public static clearAll(actorName: string, actorRole: string): void {
    const logBeforeClear = this.getAllLogs();
    
    // Always keep a security record that logs were cleared
    const clearNotice: EnterpriseAuditLog = {
      id: `AUD-RESET-${Date.now()}`,
      action: 'حذف',
      oldValue: `سجل كامل يحتوي على ${logBeforeClear.length} معاملة مراجعة مدققة`,
      newValue: 'تصفير وتنظيف كامل لسجلات التدقيق الموحدة (System Audit Trail Wipe)',
      userName: actorName,
      userRole: actorRole,
      device: 'نظام إدارة الرقابة والأمن المركزي',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      timestamp: new Date().toISOString(),
      module: 'الإعدادات والرقابة المركزية (Compliance Control)',
      ipAddress: '127.0.0.1'
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify([clearNotice]));
    
    EnterpriseLogger.warn(
      `Audit trail was wiped by ${actorName} (${actorRole})`,
      'EnterpriseAuditLogger'
    );

    this.notify();
  }

  /**
   * Export audit log records into a clean, Excel-compatible Arabic-supported CSV file with BOM
   */
  public static exportToCSV(logs: EnterpriseAuditLog[]): string {
    const headers = [
      'ID سجل الرقابة',
      'العملية / الحدث',
      'القيمة القديمة',
      'القيمة الجديدة',
      'المستخدم',
      'الرتبة / الدور الوظيفي',
      'الجهاز المتصل',
      'التاريخ',
      'الوقت',
      'النظام / المودول المسبب',
      'IP Address'
    ];

    const rows = logs.map(log => [
      log.id,
      log.action,
      log.oldValue.replace(/"/g, '""').replace(/\n/g, ' '),
      log.newValue.replace(/"/g, '""').replace(/\n/g, ' '),
      log.userName.replace(/"/g, '""'),
      log.userRole.replace(/"/g, '""'),
      log.device.replace(/"/g, '""'),
      log.date,
      log.time,
      log.module.replace(/"/g, '""'),
      log.ipAddress
    ]);

    const csvContent = [
      '\uFEFF' + headers.map(h => `"${h}"`).join(','), // UTF-8 BOM header for Arabic support in MS Excel
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }
}
