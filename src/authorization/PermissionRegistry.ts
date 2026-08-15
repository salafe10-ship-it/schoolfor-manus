export type PermissionCode = string;

export const PERMISSIONS = {
  PLATFORM_ADMIN: 'Platform.Admin',
  DASHBOARD_VIEW: 'Dashboard.View',
  DATABASE_MONITOR: 'Database.Monitor',
  DATABASE_SETTINGS: 'Database.Settings',
  DATABASE_SIMULATE: 'Database.Simulate',
  DATABASE_OPTIMIZE: 'Database.Optimize',
  DATABASE_BACKUP: 'Database.Backup',
  AUDIT_READ: 'Audit.Read',
  STUDENT_READ: 'Student.View',
  STUDENT_EXPORT: 'Student.Export',
  STUDENT_WRITE: 'Student.Write',
  STUDENT_REGISTRATION_CREATE: 'Student.Registration.Create',
  STUDENT_GUARDIAN_LINK: 'Student.Guardian.Link',
  STUDENT_NUMBER_OVERRIDE: 'Student.Number.Override',
  STUDENT_DUPLICATE_OVERRIDE: 'Student.Duplicate.Override',
  STUDENT_DELETE: 'Student.Delete',
  STUDENT_DOCUMENT_VIEW: 'StudentDocument.View',
  STUDENT_DOCUMENT_CREATE: 'StudentDocument.Create',
  STUDENT_DOCUMENT_VERIFY: 'StudentDocument.Verify',
  STUDENT_DOCUMENT_ARCHIVE: 'StudentDocument.Archive',
  STUDENT_DOCUMENT_ACCESS_LOG_VIEW: 'StudentDocument.AccessLog.View',
  STUDENT_DOCUMENT_VERSION_CREATE: 'StudentDocument.Version.Create',
  EXAM_READ: 'Exam.View',
  EXAM_WRITE: 'Exam.Write',
  FINANCIAL_READ: 'Financial.Read',
  FINANCIAL_WRITE: 'Financial.Write',
  INVENTORY_READ: 'Inventory.View',
  INVENTORY_WRITE: 'Inventory.Write',
  AI_FORECAST: 'Ai.Forecast',
  AI_CHAT: 'Ai.Chat'
} as const;

// Legacy codes remain registered for compatibility, but all checks are normalized
// to the Resource.Action form before evaluation.
const LEGACY_PERMISSION_NAMES = [
  'dashboard:view', 'dashboard:refresh', 'settings:view', 'settings:edit',
  'ledger:view', 'ledger:insert', 'ledger:edit', 'ledger:delete', 'ledger:approve', 'ledger:cancel', 'ledger:post', 'ledger:reverse', 'ledger:export', 'ledger:print',
  'invoice:view', 'invoice:insert', 'invoice:edit', 'invoice:delete', 'invoice:approve', 'invoice:cancel', 'invoice:post', 'invoice:reverse', 'invoice:export', 'invoice:print',
  'financial:read', 'financial:write', 'financial:approve', 'financial:post',
  'audit:read', 'audit:view', 'permissions:view', 'permissions:edit', 'permissions:audit_logs',
  'student:view', 'student:insert', 'student:edit', 'student:delete', 'student:export', 'student:print', 'student:import', 'student:read', 'student:write',
  'attendance:view', 'attendance:insert', 'attendance:edit', 'attendance:export', 'attendance:print',
  'hr:view', 'hr:insert', 'hr:edit', 'hr:delete', 'hr:approve', 'hr:cancel', 'hr:post', 'hr:export', 'hr:print',
  'exam:view', 'exam:insert', 'exam:edit', 'exam:delete', 'exam:approve', 'exam:cancel', 'exam:post', 'exam:export', 'exam:print', 'exam:read', 'exam:write',
  'warehouse:view', 'warehouse:insert', 'warehouse:edit', 'warehouse:export', 'warehouse:print',
  'assets:view', 'assets:insert', 'assets:edit', 'assets:export', 'assets:print',
  'ai:chat', 'ai:forecast',
  'database:monitor', 'database:settings', 'database:simulate', 'database:optimize', 'database:backup',
  'student:read', 'student:write', 'financial:read', 'financial:write',
  'branches:view', 'library:view', 'inventory:view', 'inventory:write', 'procurement:view', 'fixed_assets:view', 'buses:view', 'uniform_management:view', 'permissions:view'
] as const;

const titleCase = (value: string) => value.length ? value[0].toUpperCase() + value.slice(1).toLowerCase() : value;
const legacyToCanonical = (value: string) => {
  const [resource, action] = value.split(':');
  return `${titleCase(resource)}.${titleCase(action)}`;
};

const LEGACY_ALIASES: Record<string, string> = Object.fromEntries(
  LEGACY_PERMISSION_NAMES.map(permission => [permission, legacyToCanonical(permission)])
);

const REGISTERED_PERMISSIONS = new Set<string>([
  PERMISSIONS.PLATFORM_ADMIN,
  ...Object.values(PERMISSIONS),
  ...Object.values(LEGACY_ALIASES)
]);

export class PermissionRegistry {
  private readonly normalized = new Map<string, string>();

  constructor() {
    for (const permission of REGISTERED_PERMISSIONS) {
      this.normalized.set(permission.toLowerCase(), permission);
    }
    for (const [legacy, canonical] of Object.entries(LEGACY_ALIASES)) {
      this.normalized.set(legacy.toLowerCase(), canonical);
    }
  }

  normalize(permission: unknown): string | null {
    if (typeof permission !== 'string' || !permission.trim()) return null;
    return this.normalized.get(permission.trim().toLowerCase()) || null;
  }

  isKnown(permission: unknown): boolean {
    return this.normalize(permission) !== null;
  }

  list(): string[] {
    return [...REGISTERED_PERMISSIONS];
  }
}

export const permissionRegistry = new PermissionRegistry();
