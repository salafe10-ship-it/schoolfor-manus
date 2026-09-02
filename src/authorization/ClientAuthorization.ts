import { PERMISSIONS } from './PermissionRegistry';
import { AuthorizationIdentity } from './RoleResolver';
import { CENTRAL_SECTION_IDS } from '../security/CustomerProductionPortalPolicy';

const CENTRAL_SECTIONS = CENTRAL_SECTION_IDS;

const SECTION_PERMISSIONS: Record<string, string> = {
  dashboard: PERMISSIONS.DASHBOARD_VIEW,
  ai_assistant: PERMISSIONS.AI_CHAT,
  branches: 'Branches.View',
  students: PERMISSIONS.STUDENT_READ,
  parents: PERMISSIONS.STUDENT_READ,
  attendance: 'Attendance.View',
  exams: PERMISSIONS.EXAM_READ,
  library: 'Library.View',
  teachers: 'Hr.View',
  accounts: PERMISSIONS.FINANCIAL_READ,
  treasury: PERMISSIONS.FINANCIAL_READ,
  financial_reports: PERMISSIONS.FINANCIAL_READ,
  student_accounts: PERMISSIONS.FINANCIAL_READ,
  inventory: 'Inventory.View',
  procurement: 'Procurement.View',
  fixed_assets: 'Fixed_assets.View',
  buses: 'Buses.View',
  school_transport: 'Buses.View',
  uniform_management: 'Uniform_management.View',
  school_uniform: 'Uniform_management.View',
  permissions_admin: 'Permissions.View',
  settings: 'Settings.View',
  audit_logs: PERMISSIONS.AUDIT_READ,
  general_review: PERMISSIONS.AUDIT_READ
};

export function canAccessSection(
  identity: AuthorizationIdentity | null | undefined,
  sectionId: string,
  context: { currentPortal?: 'login' | 'school' | 'admin' } = {}
): boolean {
  if (!identity || context.currentPortal === 'login') return false;
  if (CENTRAL_SECTIONS.has(sectionId)) {
    // A tenant role named SuperAdmin is not a platform role.  The central
    // workspace is available only after the server projects Platform.Admin
    // from the dedicated platform RBAC tables.
    const hasServerDerivedPlatformPermission = Array.isArray(identity.platformPermissions)
      && identity.platformPermissions.includes(PERMISSIONS.PLATFORM_ADMIN);
    return context.currentPortal === 'admin' && hasServerDerivedPlatformPermission;
  }
  const permission = SECTION_PERMISSIONS[sectionId];
  if (!permission) return false;
  // A session without the server-derived permission hint is not allowed to
  // fall back to the legacy role map for tenant modules. The dashboard is a
  // safe landing surface after authentication; every protected module must
  // remain hidden until the trusted server response includes its permissions.
  if (!Array.isArray(identity.permissions)) return sectionId === 'dashboard';
  return identity.permissions.includes('*') || identity.permissions.includes(permission);
}

export { CENTRAL_SECTIONS, SECTION_PERMISSIONS };
