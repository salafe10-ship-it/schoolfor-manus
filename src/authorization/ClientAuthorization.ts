import { PERMISSIONS } from './PermissionRegistry';
import { AuthorizationIdentity, roleResolver } from './RoleResolver';

const CENTRAL_SECTIONS = new Set([
  'system_health', 'db_schema', 'super_dashboard', 'super_stats', 'super_schools', 'super_domains', 'super_operations', 'super_license',
  'super_databases', 'super_users', 'super_settings', 'super_audit', 'super_system_governance', 'super_deployment', 'super_rbac',
  'super_security', 'super_backups', 'super_finance', 'super_infra', 'core_certification', 'business_logic_audit', 'accounting_integrity',
  'security_permissions_cert', 'uiux_golden_standard_cert', 'performance_stability_cert', 'maintainability_scalability_cert',
  'zero_regression_cert', 'production_readiness_gate', 'docs_hardening', 'wave1_certification', 'core_system_cert',
  'operational_excellence_cert', 'user_trust_cert', 'commercial_release', 'commercial_competitiveness', 'product_maturity',
  'golden_release_exec', 'ddd_reconstruction'
]);

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
    try {
      const hasServerDerivedPlatformPermission = Array.isArray(identity.platformPermissions)
        ? identity.platformPermissions.includes(PERMISSIONS.PLATFORM_ADMIN)
        : roleResolver.isSuperAdmin(identity);
      return context.currentPortal === 'admin' && hasServerDerivedPlatformPermission;
    } catch {
      return false;
    }
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
