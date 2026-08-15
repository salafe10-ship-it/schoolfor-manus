// src/modules/authorization/domain/Permission.ts

export enum Resource {
  STUDENT = 'student',
  INVOICE = 'invoice',
  COURSE = 'course',
  ADMISSION_INQUIRY = 'admission_inquiry',
  ATTENDANCE = 'attendance',
  PARENT = 'parent',
  PAYMENT = 'payment',
  JOURNAL_ENTRY = 'journal_entry',
  REPORT = 'report',
  SYSTEM_SETTINGS = 'system_settings'
}

export enum Action {
  // Legacy actions (for backward compatibility)
  READ = 'read',
  WRITE = 'write',
  CREATE = 'create',
  
  // 10 fine-grained core actions
  VIEW = 'view',
  INSERT = 'insert',
  EDIT = 'edit',
  DELETE = 'delete',
  APPROVE = 'approve',
  CANCEL = 'cancel',
  POST = 'post',
  REVERSE = 'reverse',
  EXPORT = 'export',
  PRINT = 'print'
}

export interface Permission {
  resource: Resource;
  action: Action;
}

// Enterprise Permission Matrix (Role-based)
// Mapped for strict server-side checking
export const RolePermissions: Record<string, Permission[]> = {
  ADMIN: [
    { resource: Resource.STUDENT, action: Action.VIEW },
    { resource: Resource.STUDENT, action: Action.INSERT },
    { resource: Resource.STUDENT, action: Action.EDIT },
    { resource: Resource.STUDENT, action: Action.DELETE },
    { resource: Resource.STUDENT, action: Action.EXPORT },
    { resource: Resource.STUDENT, action: Action.PRINT },
    { resource: Resource.INVOICE, action: Action.VIEW },
    { resource: Resource.INVOICE, action: Action.INSERT },
    { resource: Resource.INVOICE, action: Action.EDIT },
    { resource: Resource.INVOICE, action: Action.DELETE },
    { resource: Resource.INVOICE, action: Action.APPROVE },
    { resource: Resource.INVOICE, action: Action.CANCEL },
    { resource: Resource.INVOICE, action: Action.POST },
    { resource: Resource.INVOICE, action: Action.REVERSE },
    { resource: Resource.INVOICE, action: Action.EXPORT },
    { resource: Resource.INVOICE, action: Action.PRINT },
    { resource: Resource.COURSE, action: Action.VIEW },
    { resource: Resource.ATTENDANCE, action: Action.VIEW },
    { resource: Resource.ATTENDANCE, action: Action.INSERT },
    { resource: Resource.ATTENDANCE, action: Action.EDIT },
    { resource: Resource.SYSTEM_SETTINGS, action: Action.VIEW }
  ],
  FINANCIAL_MANAGER: [
    { resource: Resource.INVOICE, action: Action.VIEW },
    { resource: Resource.INVOICE, action: Action.INSERT },
    { resource: Resource.INVOICE, action: Action.EDIT },
    { resource: Resource.INVOICE, action: Action.DELETE },
    { resource: Resource.INVOICE, action: Action.APPROVE },
    { resource: Resource.INVOICE, action: Action.CANCEL },
    { resource: Resource.INVOICE, action: Action.POST },
    { resource: Resource.INVOICE, action: Action.REVERSE },
    { resource: Resource.INVOICE, action: Action.EXPORT },
    { resource: Resource.INVOICE, action: Action.PRINT },
    { resource: Resource.JOURNAL_ENTRY, action: Action.VIEW },
    { resource: Resource.JOURNAL_ENTRY, action: Action.INSERT },
    { resource: Resource.JOURNAL_ENTRY, action: Action.EDIT },
    { resource: Resource.JOURNAL_ENTRY, action: Action.APPROVE },
    { resource: Resource.JOURNAL_ENTRY, action: Action.CANCEL },
    { resource: Resource.JOURNAL_ENTRY, action: Action.POST },
    { resource: Resource.JOURNAL_ENTRY, action: Action.REVERSE },
    { resource: Resource.JOURNAL_ENTRY, action: Action.EXPORT },
    { resource: Resource.JOURNAL_ENTRY, action: Action.PRINT }
  ],
  ACCOUNTANT: [
    { resource: Resource.INVOICE, action: Action.VIEW },
    { resource: Resource.INVOICE, action: Action.INSERT },
    { resource: Resource.INVOICE, action: Action.EDIT },
    { resource: Resource.INVOICE, action: Action.POST },
    { resource: Resource.INVOICE, action: Action.EXPORT },
    { resource: Resource.INVOICE, action: Action.PRINT },
    { resource: Resource.JOURNAL_ENTRY, action: Action.VIEW },
    { resource: Resource.JOURNAL_ENTRY, action: Action.INSERT },
    { resource: Resource.JOURNAL_ENTRY, action: Action.EDIT },
    { resource: Resource.JOURNAL_ENTRY, action: Action.POST },
    { resource: Resource.JOURNAL_ENTRY, action: Action.EXPORT },
    { resource: Resource.JOURNAL_ENTRY, action: Action.PRINT }
  ],
  TEACHER: [
    { resource: Resource.STUDENT, action: Action.VIEW },
    { resource: Resource.COURSE, action: Action.VIEW },
    { resource: Resource.ATTENDANCE, action: Action.VIEW },
    { resource: Resource.ATTENDANCE, action: Action.INSERT },
    { resource: Resource.ATTENDANCE, action: Action.EDIT }
  ],
  AUDITOR: [
    { resource: Resource.STUDENT, action: Action.VIEW },
    { resource: Resource.STUDENT, action: Action.EXPORT },
    { resource: Resource.STUDENT, action: Action.PRINT },
    { resource: Resource.INVOICE, action: Action.VIEW },
    { resource: Resource.INVOICE, action: Action.EXPORT },
    { resource: Resource.INVOICE, action: Action.PRINT },
    { resource: Resource.JOURNAL_ENTRY, action: Action.VIEW },
    { resource: Resource.JOURNAL_ENTRY, action: Action.EXPORT },
    { resource: Resource.JOURNAL_ENTRY, action: Action.PRINT },
    { resource: Resource.REPORT, action: Action.VIEW },
    { resource: Resource.REPORT, action: Action.EXPORT },
    { resource: Resource.REPORT, action: Action.PRINT }
  ]
};
